"""Thread-safe in-memory store for Job records and their output artifacts.

The Job model itself lives in fari-twin-types (the shared wire format), so the
HTTP shape is the same as the TypeScript side. Swap this for a Redis- or
DB-backed store later without changing the service surface.
"""

from __future__ import annotations

from collections.abc import Iterable
from pathlib import Path
from threading import RLock
from typing import Any

from fari_twin_types import Job


class InMemoryJobStore:
    def __init__(self) -> None:
        self._jobs: dict[str, Job] = {}
        self._artifacts: dict[str, list[Path]] = {}
        self._lock = RLock()

    def put(self, job: Job) -> None:
        with self._lock:
            self._jobs[job.id] = job

    def get(self, job_id: str) -> Job | None:
        with self._lock:
            return self._jobs.get(job_id)

    def list(self) -> list[Job]:
        with self._lock:
            return list(self._jobs.values())

    def update(self, job_id: str, **fields: Any) -> Job | None:
        with self._lock:
            existing = self._jobs.get(job_id)
            if existing is None:
                return None
            updated = existing.model_copy(update=fields)
            self._jobs[job_id] = updated
            return updated

    def set_artifacts(self, job_id: str, paths: Iterable[Path]) -> None:
        with self._lock:
            self._artifacts[job_id] = list(paths)

    def artifact(self, job_id: str, filename: str) -> Path | None:
        with self._lock:
            for path in self._artifacts.get(job_id, []):
                if path.name == filename:
                    return path
        return None
