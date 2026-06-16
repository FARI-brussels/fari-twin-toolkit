# fari-twin-types

Pydantic v2 models for the FARI Twin Toolkit wire format. **Generated** from
`specs/openapi.yaml` — the same source of truth as the TypeScript
`@fari-brussels/twin-types` package, so the two never drift.

## Install

```bash
uv add fari-twin-types
# or: pip install fari-twin-types
```

## Usage

```python
from fari_twin_types import Place, Job, Scenario, Indicator

place = Place(id="21004", name="Bruxelles", kind="municipality", code="21004")
job = Job(id="j1", kind="gpr", status="running", progress_pct=50)
place.model_dump_json(exclude_none=True)  # snake_case wire format
```

## Regenerate

Models are committed; regenerate whenever `specs/openapi.yaml` changes:

```bash
./generate.sh   # uvx datamodel-code-generator -> fari_twin_types/models.py
```

CI should run this and fail on any diff (the codegen-up-to-date check). Do not
edit `fari_twin_types/models.py` by hand.
