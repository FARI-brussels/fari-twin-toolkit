from pathlib import Path

from fari_pipeline_core import Pipeline, StepContext, step
from fari_pipeline_service import create_pipeline_service
from fastapi.testclient import TestClient


@step("hello")
def greet(ctx: StepContext) -> None:
    ctx.data["greeting"] = f"hi {ctx.params.get('name', 'world')}"


@step("write")
def write_file(ctx: StepContext) -> None:
    out = Path(ctx.params["out_dir"]) / "out.txt"
    out.write_text(ctx.data["greeting"])
    ctx.artifacts.append(out)


def test_submit_runs_pipeline_and_serves_result(tmp_path: Path) -> None:
    app = create_pipeline_service(Pipeline([greet, write_file]), name="hello", run_inline=True)
    client = TestClient(app)

    response = client.post("/jobs", json={"params": {"name": "FARI", "out_dir": str(tmp_path)}})
    assert response.status_code == 200
    job = response.json()
    assert job["kind"] == "hello"
    # run_inline => already done by the time we get the response
    assert job["status"] == "succeeded"
    assert job["progress_pct"] == 100.0
    assert job["step_count"] == 2

    listing = client.get("/jobs").json()
    assert len(listing) == 1
    assert listing[0]["id"] == job["id"]

    result = client.get(f"/jobs/{job['id']}/result").json()
    assert "hello" in result["report"]["timings"]
    assert "write" in result["report"]["timings"]
    assert len(result["files"]) == 1
    assert result["files"][0]["filename"] == "out.txt"

    file_url = result["files"][0]["url"]
    file_response = client.get(file_url)
    assert file_response.status_code == 200
    assert file_response.text == "hi FARI"


def test_failing_pipeline_reports_status_and_error(tmp_path: Path) -> None:
    @step("boom")
    def fails(ctx: StepContext) -> None:
        raise RuntimeError("ouch")

    app = create_pipeline_service(Pipeline([fails]), name="explode", run_inline=True)
    client = TestClient(app)

    job = client.post("/jobs", json={"params": {}}).json()
    assert job["status"] == "failed"
    assert "ouch" in job["error"]

    # result endpoint refuses while not succeeded
    assert client.get(f"/jobs/{job['id']}/result").status_code == 409


def test_unknown_job_is_404() -> None:
    app = create_pipeline_service(Pipeline([]))
    client = TestClient(app)
    assert client.get("/jobs/missing").status_code == 404
    assert client.get("/jobs/missing/result").status_code == 404
    assert client.get("/jobs/missing/files/x.txt").status_code == 404
