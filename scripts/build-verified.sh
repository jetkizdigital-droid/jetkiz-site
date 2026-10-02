#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec bash "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

command -v timeout >/dev/null || {
  echo "build-verified.sh requires GNU timeout." >&2
  exit 69
}

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"

hero_asset_dir="${SITES_PROJECT_ROOT}/assets"
hero_output="${SITES_PROJECT_ROOT}/public/generated/jetkiz-courier-burabay.webp"
hero_sha256="6e649b24e6289ad9c39f36ff41113ef6923a7f33f3855e6153d23af26d5ca115"

mkdir -p "$(dirname "${hero_output}")"
cat "${hero_asset_dir}"/jetkiz-courier-burabay.part* | base64 --decode > "${hero_output}"

actual_hero_sha256="$(sha256sum "${hero_output}" | awk '{print $1}')"
if [[ "${actual_hero_sha256}" != "${hero_sha256}" ]]; then
  echo "Courier hero asset checksum mismatch." >&2
  exit 69
fi

echo "Prepared static courier hero asset."

hero_hq_output="${SITES_PROJECT_ROOT}/public/generated/jetkiz-courier-hero-hq-v3.jpg"
hero_hq_sha256="dbf0d59192bcf62050db56670bbdcb7880934daef5b0cc94f8b8f382d75d3493"

cat "${hero_asset_dir}"/hero-hq-v2.part* | base64 --decode > "${hero_hq_output}"
actual_hero_hq_sha256="$(sha256sum "${hero_hq_output}" | awk '{print $1}')"
if [[ "${actual_hero_hq_sha256}" != "${hero_hq_sha256}" ]]; then
  echo "HQ courier hero asset checksum mismatch." >&2
  exit 69
fi

echo "Prepared HQ courier hero asset."

if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Running bounded vinext build..."
timeout \
  --signal=TERM \
  --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
  "${SITES_BUILD_TIMEOUT:-3m}" \
  "${vinext}" build

bash "${script_dir}/validate-artifact.sh"
