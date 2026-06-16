# fari-pipeline-core

Step orchestration for long-running analysis pipelines. Generalized from
TreeCity's GPR pipeline (which it can host without losing any behavior).
Framework-free — usable from a notebook, CLI, or wrapped by
[`fari-pipeline-service`](../pipeline-service) for HTTP.

```python
from fari_pipeline_core import Pipeline, step

@step("assemble")
def s1(ctx):
    ctx.data["raw"] = load(ctx.params["tree_id"])

@step("normalize")
def s2(ctx):
    ctx.data["norm"] = normalize(ctx.data["raw"])

@step("export PLY")
def s3(ctx):
    out = export(ctx.data["norm"])
    ctx.artifacts.append(out)

pipeline = Pipeline([s1, s2, s3])
result = pipeline.run(
    params={"tree_id": 12},
    on_progress=lambda ev: print(ev.step_index, ev.step_name, ev.status),
)
print(result.timings)             # per-step seconds
print(result.context.artifacts)    # output files
```

## What it gives you

- **`Pipeline.run(params, on_progress)`** — ordered execution, per-step timings,
  total duration.
- **`StepContext`** — `params` (immutable input), `data` (mutable bag for
  intermediates), `artifacts` (output `Path`s for the wrapping service to expose).
- **`ProgressEvent`** — `started` / `succeeded` / `failed` for each step, with
  index/count/name/duration — the seam any HTTP wrapper hooks into.
- **`PipelineError`** — wraps a failing step's exception with `step_name`,
  `step_index`, and the original `cause`.
- **`@step(name?)`** — decorator that turns a function into a named `StepDef`.

## Install / test

```bash
uv add fari-pipeline-core
uv run pytest -q   # in this repo
```
