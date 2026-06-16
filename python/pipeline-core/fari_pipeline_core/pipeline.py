"""Generic step orchestration for long-running analyses.

A Pipeline is a sequence of named Steps. Each step receives a mutable
StepContext (params + data bag + artifacts list) and either succeeds or raises.
The runner records per-step timings and invokes an optional progress callback
between phases — that's the only seam an HTTP wrapper needs to report progress.

This module is intentionally framework-free so it stays usable from a FastAPI
service, a CLI, or a notebook.
"""

from __future__ import annotations

import time
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Literal


@dataclass
class StepContext:
    """What flows between steps: inputs, a free-form data bag, and artifacts."""

    params: dict[str, Any] = field(default_factory=dict)
    data: dict[str, Any] = field(default_factory=dict)
    artifacts: list[Path] = field(default_factory=list)


@dataclass
class ProgressEvent:
    step_index: int
    step_count: int
    step_name: str
    status: Literal["started", "succeeded", "failed"]
    duration_s: float | None = None
    error: str | None = None


StepFn = Callable[[StepContext], None]
ProgressCallback = Callable[[ProgressEvent], None]


@dataclass
class StepDef:
    name: str
    run: StepFn


def step(name: str | None = None) -> Callable[[StepFn], StepDef]:
    """Decorator: turn a function into a named StepDef.

    @step()                 # uses fn.__name__
    def normalize(ctx): ...

    @step("export PLY")     # explicit human name
    def export(ctx): ...
    """

    def deco(fn: StepFn) -> StepDef:
        return StepDef(name=name or fn.__name__, run=fn)

    return deco


@dataclass
class PipelineResult:
    context: StepContext
    timings: dict[str, float]
    total_duration_s: float


class PipelineError(Exception):
    """Raised when a step raises; preserves the step's identity and cause."""

    def __init__(self, step_name: str, step_index: int, cause: BaseException) -> None:
        super().__init__(f"step {step_index} ({step_name!r}) failed: {cause}")
        self.step_name = step_name
        self.step_index = step_index
        self.cause = cause


class Pipeline:
    """Ordered sequence of steps run end-to-end on a shared StepContext."""

    def __init__(self, steps: list[StepDef]) -> None:
        self.steps = list(steps)

    def run(
        self,
        params: dict[str, Any] | None = None,
        on_progress: ProgressCallback | None = None,
    ) -> PipelineResult:
        ctx = StepContext(params=dict(params or {}))
        timings: dict[str, float] = {}
        total_start = time.perf_counter()
        count = len(self.steps)

        for index, step_def in enumerate(self.steps):
            if on_progress:
                on_progress(
                    ProgressEvent(
                        step_index=index,
                        step_count=count,
                        step_name=step_def.name,
                        status="started",
                    )
                )
            started = time.perf_counter()
            try:
                step_def.run(ctx)
            except Exception as cause:
                duration = time.perf_counter() - started
                timings[step_def.name] = duration
                if on_progress:
                    on_progress(
                        ProgressEvent(
                            step_index=index,
                            step_count=count,
                            step_name=step_def.name,
                            status="failed",
                            duration_s=duration,
                            error=str(cause),
                        )
                    )
                raise PipelineError(
                    step_name=step_def.name, step_index=index, cause=cause
                ) from cause
            duration = time.perf_counter() - started
            timings[step_def.name] = duration
            if on_progress:
                on_progress(
                    ProgressEvent(
                        step_index=index,
                        step_count=count,
                        step_name=step_def.name,
                        status="succeeded",
                        duration_s=duration,
                    )
                )

        return PipelineResult(
            context=ctx,
            timings=timings,
            total_duration_s=time.perf_counter() - total_start,
        )
