# Python packages

Python libraries and services for the FARI Twin Toolkit. Managed with
[uv](https://docs.astral.sh/uv/), independently of the pnpm/turbo JS workspace.

| Package             | Purpose                                             | Status |
| ------------------- | --------------------------------------------------- | ------ |
| `twin-types/`       | Pydantic models generated from `specs/openapi.yaml` | ready  |
| `pipeline-core/`    | Step orchestration for long-running analysis        | ready  |
| `pipeline-service/` | FastAPI template wrapping pipeline-core             | ready  |

Each package has its own `pyproject.toml`. Run a package's tooling from its
directory, e.g. `cd twin-types && uv run python -c "import fari_twin_types"`.
