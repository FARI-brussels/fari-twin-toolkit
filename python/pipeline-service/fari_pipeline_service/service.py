"""FastAPI template wrapping a fari-pipeline-core Pipeline.

`create_pipeline_service(pipeline)` returns an `FastAPI` app exposing:

    POST   /jobs                          submit a new job
    GET    /jobs                          list jobs
    GET    /jobs/{job_id}                 job status / progress
    GET    /jobs/{job_id}/result          result + file urls
    GET    /jobs/{job_id}/files/{name}    download an artifact

Jobs run on a ThreadPoolExecutor; pass `run_inline=True` for deterministic
testing. Job records use fari-twin-types Pydantic models, so the wire shape is
the same as @fari/twin-types on the TypeScript side.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from fari_pipeline_core import Pipeline, PipelineError, ProgressEvent
from fari_twin_types import Job, JobFile, JobResult, JobStatus
from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from .store import InMemoryJobStore


class SubmitJobRequest(BaseModel):
    params: dict[str, Any] | None = None


def _now() -> datetime:
    return datetime.now(timezone.utc)


def create_pipeline_service(
    pipeline: Pipeline,
    *,
    name: str = "pipeline",
    max_workers: int = 1,
    run_inline: bool = False,
    file_url_prefix: str = "/jobs",
) -> FastAPI:
    """Build a FastAPI app exposing the standard pipeline endpoints.

    Args:
        pipeline: the pipeline to run when a job is submitted.
        name: shown as ``Job.kind`` and in the OpenAPI title.
        max_workers: ThreadPoolExecutor size for concurrent jobs.
        run_inline: if True, jobs execute synchronously inside POST /jobs — for
            tests. In production leave this False.
        file_url_prefix: prefix used to build artifact URLs. Set if the app is
            mounted under a non-root path.
    """

    app = FastAPI(title=f"FARI {name} pipeline")
    store = InMemoryJobStore()
    executor = ThreadPoolExecutor(max_workers=max_workers)
    step_count = len(pipeline.steps)

    def _execute(job_id: str) -> None:
        existing = store.get(job_id)
        if existing is None:
            return
        store.update(job_id, status=JobStatus.running, started_at=_now(), progress_pct=0.0)

        def on_progress(event: ProgressEvent) -> None:
            if event.status == "started":
                pct = (event.step_index / event.step_count) * 100 if event.step_count else 0.0
                store.update(
                    job_id,
                    current_step=event.step_name,
                    step_index=event.step_index,
                    progress_pct=pct,
                )

        try:
            result = pipeline.run(params=existing.params or {}, on_progress=on_progress)
            store.set_artifacts(job_id, result.context.artifacts)
            files = [
                JobFile(filename=path.name, url=f"{file_url_prefix}/{job_id}/files/{path.name}")
                for path in result.context.artifacts
            ]
            store.update(
                job_id,
                status=JobStatus.succeeded,
                progress_pct=100.0,
                current_step=None,
                step_index=step_count - 1 if step_count else None,
                finished_at=_now(),
                result=JobResult(report={"timings": result.timings}, files=files),
            )
        except PipelineError as err:
            store.update(
                job_id,
                status=JobStatus.failed,
                error=str(err),
                finished_at=_now(),
            )

    @app.post("/jobs", response_model=Job)
    def submit(req: SubmitJobRequest) -> Job:
        job_id = str(uuid4())
        job = Job(
            id=job_id,
            kind=name,
            status=JobStatus.pending,
            progress_pct=0.0,
            step_count=step_count,
            params=req.params or {},
            created_at=_now(),
        )
        store.put(job)
        if run_inline:
            _execute(job_id)
        else:
            executor.submit(_execute, job_id)
        # Return the latest snapshot (will already be final if run_inline).
        return store.get(job_id) or job

    @app.get("/jobs", response_model=list[Job])
    def list_jobs() -> list[Job]:
        return store.list()

    @app.get("/jobs/{job_id}", response_model=Job)
    def get_job(job_id: str) -> Job:
        job = store.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="job not found")
        return job

    @app.get("/jobs/{job_id}/result", response_model=JobResult)
    def get_result(job_id: str) -> JobResult:
        job = store.get(job_id)
        if job is None:
            raise HTTPException(status_code=404, detail="job not found")
        if job.status != JobStatus.succeeded or job.result is None:
            raise HTTPException(status_code=409, detail=f"job is {job.status}")
        return job.result

    @app.get("/jobs/{job_id}/files/{filename}")
    def get_file(job_id: str, filename: str) -> FileResponse:
        path = store.artifact(job_id, filename)
        if path is None or not path.exists():
            raise HTTPException(status_code=404, detail="file not found")
        return FileResponse(path)

    # Expose the store so tests / advanced wrappers can introspect.
    app.state.job_store = store  # type: ignore[attr-defined]
    return app
