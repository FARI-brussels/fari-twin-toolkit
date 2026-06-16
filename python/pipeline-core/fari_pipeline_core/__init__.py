"""fari-pipeline-core: ordered, framework-free step orchestration."""

from .pipeline import (
    Pipeline,
    PipelineError,
    PipelineResult,
    ProgressCallback,
    ProgressEvent,
    StepContext,
    StepDef,
    StepFn,
    step,
)

__all__ = [
    "Pipeline",
    "PipelineError",
    "PipelineResult",
    "ProgressCallback",
    "ProgressEvent",
    "StepContext",
    "StepDef",
    "StepFn",
    "step",
]
