# fari-pipeline-service

A drop-in FastAPI service wrapping a [`fari-pipeline-core`](../pipeline-core)
`Pipeline`. Same wire format as `@fari-brussels/twin-types` on the TS side (`Job`,
`JobResult`, `JobFile`), so a frontend that knows the toolkit can talk to any
pipeline service without surprises.

```python
from fari_pipeline_core import Pipeline, step
from fari_pipeline_service import create_pipeline_service

@step("assemble") ...
@step("normalize") ...
@step("export") ...

pipeline = Pipeline([assemble, normalize, export])
app = create_pipeline_service(pipeline, name="gpr")
# uvicorn main:app
```

## Endpoints

| Method | Path                          | Description                                                        |
| ------ | ----------------------------- | ------------------------------------------------------------------ |
| `POST` | `/jobs`                       | Submit a new job (body: `{ params: { ... } }`). Returns the `Job`. |
| `GET`  | `/jobs`                       | List jobs.                                                         |
| `GET`  | `/jobs/{id}`                  | Current `Job` (status, progress_pct, current_step, ...).           |
| `GET`  | `/jobs/{id}/result`           | `JobResult` once `status == "succeeded"`, else 409.                |
| `GET`  | `/jobs/{id}/files/{filename}` | Download an output artifact.                                       |

Progress is updated between steps via `pipeline-core`'s `ProgressEvent`. The
in-memory `InMemoryJobStore` is fine for a single-process POC — swap for Redis
or a DB later without changing the HTTP surface.

## Testing

```bash
uv run pytest -q
```

Tests use FastAPI's `TestClient` with `run_inline=True` so the pipeline runs
synchronously inside `POST /jobs` (deterministic, no sleeping).
