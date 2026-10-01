# TopicAmplify

Sanitized historical source from the 2023-04-24 project backup. This repository preserves application variants, crawler code and notebooks for review. It is not a deployment-ready release.

## Contents

- `complete`, `Chang`, `all`, and `express`: historical Node.js application variants.
- `web crawler`, `LDA Topic Model`, and `Search`: crawler and analysis code.
- Notebooks retain source cells with saved outputs and execution counts removed.
- Package manifests, lockfiles, selected stop-word configuration and web assets are retained.

Bundled dependencies, MongoDB dumps, generated crawl datasets, model artifacts, archives, notebook checkpoints and logs are excluded. Data-dependent examples require separately supplied datasets; there is no single verified launch command for all variants.

## Configuration

Embedded mail passwords, a saved crawler cookie, and JWT/session secrets have been replaced with calls to `config/required-env.cjs`. The helper rejects missing or empty configuration. Variable names are documented in `.env.example`; supply actual values through your shell or a secret manager. Node does not automatically load this example file. Each variant has its own package manifest. The lockfiles preserve historical dependency versions and must be reviewed and updated before use.

## Security status

The original expanded backup received a ClamAV scan with zero detections on 2026-10-01. Credential removal and removal of sensitive request/session logging were performed for this publication copy. These checks do not establish that the applications are safe to deploy.

Known issues requiring repair before operation include unauthenticated Python socket deserialization through `pickle.loads`, unescaped EJS output, old dependencies with published vulnerability advisories, and incomplete account-verification/session protections. Do not expose the historical services to a network before addressing these issues.

No credentials are distributed here. Any credentials previously embedded in the backup must be revoked or rotated by their account owner before reuse. Configuration replacements do not revoke those credentials.

## Reproducibility and ownership

This import preserves several unfinished historical variants. It does not certify functional correctness or grant a license to code or assets. Confirm ownership and distribution rights before choosing a license. No dependency installation scripts, project services or notebook cells were executed during preparation.
