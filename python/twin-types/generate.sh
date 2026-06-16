#!/usr/bin/env bash
# Regenerate Pydantic models from the toolkit's OpenAPI spec.
# Single source of truth: ../../specs/openapi.yaml
set -euo pipefail
cd "$(dirname "$0")"

uvx --from 'datamodel-code-generator>=0.26' datamodel-codegen \
  --input ../../specs/openapi.yaml \
  --input-file-type openapi \
  --output fari_twin_types/models.py \
  --output-model-type pydantic_v2.BaseModel \
  --use-standard-collections \
  --use-union-operator \
  --use-schema-description \
  --field-constraints \
  --target-python-version 3.11 \
  --disable-timestamp

echo "wrote fari_twin_types/models.py"
