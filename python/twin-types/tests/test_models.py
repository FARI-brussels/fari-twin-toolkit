import pytest
from pydantic import ValidationError

from fari_twin_types import Feature, Job, Place, Scenario, ScenarioOverride


def test_place_minimal():
    p = Place(id="21004", name="Bruxelles", kind="municipality")
    assert p.kind == "municipality"
    assert p.code is None


def test_place_serializes_snake_case():
    p = Place(id="x", name="n", kind="site", parent_id="r")
    data = p.model_dump(exclude_none=True)
    assert "parent_id" in data
    assert data["kind"] == "site"


def test_job_progress_bounds():
    Job(id="j", kind="gpr", status="running", progress_pct=0)
    Job(id="j", kind="gpr", status="running", progress_pct=100)
    with pytest.raises(ValidationError):
        Job(id="j", kind="gpr", status="running", progress_pct=101)


def test_job_status_must_be_known():
    with pytest.raises(ValidationError):
        Job(id="j", kind="gpr", status="bogus", progress_pct=1)


def test_scenario_model_kind():
    s = Scenario(
        id="s",
        name="What-if",
        overrides=[ScenarioOverride(place_id="p", indicator_key="k", value=1.0)],
        model="linear",
    )
    assert s.model == "linear"
    with pytest.raises(ValidationError):
        Scenario(id="s", name="n", overrides=[], model="bogus")


def test_feature_geometry_is_nullable():
    f = Feature(type="Feature", geometry=None, properties=None)
    assert f.geometry is None
