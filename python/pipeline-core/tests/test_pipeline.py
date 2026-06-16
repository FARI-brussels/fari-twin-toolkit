import pytest

from fari_pipeline_core import (
    Pipeline,
    PipelineError,
    ProgressEvent,
    StepContext,
    step,
)


@step()
def assemble(ctx: StepContext) -> None:
    ctx.data["a"] = 1


@step("normalize values")
def normalize(ctx: StepContext) -> None:
    ctx.data["b"] = ctx.data["a"] + ctx.params.get("delta", 1)


def test_runs_steps_in_order_and_records_timings():
    events: list[ProgressEvent] = []
    result = Pipeline([assemble, normalize]).run(
        params={"delta": 2}, on_progress=events.append
    )

    assert result.context.data == {"a": 1, "b": 3}
    assert set(result.timings) == {"assemble", "normalize values"}
    assert result.total_duration_s >= 0

    started = [e for e in events if e.status == "started"]
    succeeded = [e for e in events if e.status == "succeeded"]
    assert [e.step_name for e in started] == ["assemble", "normalize values"]
    assert [e.step_index for e in started] == [0, 1]
    assert all(e.duration_s is not None for e in succeeded)


def test_failing_step_raises_pipeline_error_with_context():
    @step("boom")
    def fails(ctx: StepContext) -> None:
        raise ValueError("nope")

    events: list[ProgressEvent] = []
    with pytest.raises(PipelineError) as info:
        Pipeline([assemble, fails, normalize]).run(on_progress=events.append)

    assert info.value.step_name == "boom"
    assert info.value.step_index == 1
    assert isinstance(info.value.cause, ValueError)

    failed = [e for e in events if e.status == "failed"]
    assert len(failed) == 1
    assert failed[0].step_name == "boom"
    # later steps never run
    assert not any(e.step_name == "normalize values" for e in events)


def test_empty_pipeline_is_a_no_op():
    result = Pipeline([]).run()
    assert result.context.data == {}
    assert result.timings == {}
