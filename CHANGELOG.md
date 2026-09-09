# [0.27.0](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.26.0...v0.27.0) (2026-09-09)


### Features

* **base64-image-converter:** add a swap button between encode/decode ([f45d654](https://github.com/codysechelski/codys-dev-tools-two/commit/f45d65479fb29c7bf3e04242a3cf59ce32a3257c))
* **encoders:** add a swap button to flip mode and input/output ([921f3a6](https://github.com/codysechelski/codys-dev-tools-two/commit/921f3a6244b68072f60f1e7587ab6fe0116d0260))

# [0.26.0](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.25.5...v0.26.0) (2026-09-09)


### Bug Fixes

* **base64-image-converter:** fix dark panel background in light theme ([217baf8](https://github.com/codysechelski/codys-dev-tools-two/commit/217baf8479bc6e3cc231afc259a99eb9a583b75e))
* **icons:** use align-left for String Template Formatter ([7d6df90](https://github.com/codysechelski/codys-dev-tools-two/commit/7d6df90989f11e13fb1e8be3c121a2793ed3fa8a))
* **settings:** bump the full-width breakpoint from 1024px to 1200px ([4932126](https://github.com/codysechelski/codys-dev-tools-two/commit/4932126008e364b52a478208c3481de52928f216))
* **settings:** bump the full-width breakpoint from 1200px to 1300px ([10c104a](https://github.com/codysechelski/codys-dev-tools-two/commit/10c104aa1bc1a36b84cede8973f120745291b83d))
* **sidebar:** add top padding so the fade doesn't cover the first heading ([705b80a](https://github.com/codysechelski/codys-dev-tools-two/commit/705b80aca78f8137437e99541da489e85fc3271b))
* **sidebar:** lighten the light-mode starred gold from #b8860b to #cb9614 ([96c8cec](https://github.com/codysechelski/codys-dev-tools-two/commit/96c8ceca064fa9fc4fffc52a09f483a965b5add0)), closes [#b8860b](https://github.com/codysechelski/codys-dev-tools-two/issues/b8860b) [#cb9614](https://github.com/codysechelski/codys-dev-tools-two/issues/cb9614) [#b8860b](https://github.com/codysechelski/codys-dev-tools-two/issues/b8860b)
* **sidebar:** smooth the scroll fade and add a matching top fade ([2b7669e](https://github.com/codysechelski/codys-dev-tools-two/commit/2b7669e4a1a5b008a137fb2c56d78a2411946ed5))
* **sidebar:** use a darker gold for starred tools in light mode ([f2ec382](https://github.com/codysechelski/codys-dev-tools-two/commit/f2ec382931cb7de40eae7d96f4ef857462165371)), closes [#f4b400](https://github.com/codysechelski/codys-dev-tools-two/issues/f4b400) [#b8860b](https://github.com/codysechelski/codys-dev-tools-two/issues/b8860b)
* **tool-header:** make the icon part of the heading, not a separate block ([58955ab](https://github.com/codysechelski/codys-dev-tools-two/commit/58955ab74b64b327f4b054a6c89429d4f65e1634))
* **tool-header:** shrink the heading icon slightly (1.6em -> 1.35em) ([fae4ed9](https://github.com/codysechelski/codys-dev-tools-two/commit/fae4ed9dad375014409ce927c7cb27f66a0d111b))


### Features

* **icons:** give every tool a specific icon instead of generic reuse ([205842e](https://github.com/codysechelski/codys-dev-tools-two/commit/205842e6e18f88725238678a36672d622c4828c6))
* **settings:** let the settings panel go full width below 1024px ([8e4159b](https://github.com/codysechelski/codys-dev-tools-two/commit/8e4159bed41c18b0e6bc627c246333db83bcc56d))
* **sidebar:** fade the tool list into the footer, tighten footer spacing ([a1e1478](https://github.com/codysechelski/codys-dev-tools-two/commit/a1e14785ba2c7e981577b117b5f54707732443ef))
* **string-template-formatter:** make Format String span full width ([3192180](https://github.com/codysechelski/codys-dev-tools-two/commit/31921807c5dcf6713c4eed6a4cb1ce53f5135b5e))
* **tool-header:** show a larger tool icon next to the heading ([1cb59be](https://github.com/codysechelski/codys-dev-tools-two/commit/1cb59bef5d99ce5c4a32d062a7936149ffdc2e15))
* **tools:** add Base64 Encoder/Decoder and Base64 Image Converter ([650edf9](https://github.com/codysechelski/codys-dev-tools-two/commit/650edf96c99e5d7456377889dc8107960bb64c05))


### Reverts

* **sidebar:** remove the top/bottom scroll fade ([d0a2148](https://github.com/codysechelski/codys-dev-tools-two/commit/d0a214834a355113d4098b9763956c98be689213))

## [0.25.5](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.25.4...v0.25.5) (2026-09-09)


### Bug Fixes

* **sidebar:** restore gold color for starred tools in light mode ([b896b38](https://github.com/codysechelski/codys-dev-tools-two/commit/b896b387c25a4fade2da580ee79addbd0ea418f1))

## [0.25.4](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.25.3...v0.25.4) (2026-09-08)


### Bug Fixes

* **attributions:** add Font Awesome Free and Ubuntu Font Family ([4ffc6b3](https://github.com/codysechelski/codys-dev-tools-two/commit/4ffc6b3b7480ec10b468c6e7c33456aee08b3135))

## [0.25.3](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.25.2...v0.25.3) (2026-09-08)


### Bug Fixes

* **help-popover:** stop the editor card clipping its own tooltip ([f4cd34d](https://github.com/codysechelski/codys-dev-tools-two/commit/f4cd34db7ac11ec2316524e6cb04c7792748a494))
* **text-editor:** focus the editor after clicking Clear ([cb00537](https://github.com/codysechelski/codys-dev-tools-two/commit/cb005376b350b2fa76b5329148179970c0797adf))

## [0.25.2](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.25.1...v0.25.2) (2026-09-08)


### Bug Fixes

* **ci:** tell electron-builder to publish real releases, not drafts ([35f8797](https://github.com/codysechelski/codys-dev-tools-two/commit/35f8797972ec4c2e444d217a382df186643e4390))

## [0.25.1](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.25.0...v0.25.1) (2026-09-08)


### Bug Fixes

* **ci:** chain desktop builds via workflow_run instead of tag push ([ac6b93d](https://github.com/codysechelski/codys-dev-tools-two/commit/ac6b93da09ea25573dd691f159fa7748d09987b7))

# [0.25.0](https://github.com/codysechelski/codys-dev-tools-two/compare/v0.24.0...v0.25.0) (2026-09-08)


### Bug Fixes

* **ci:** require Node >=22.22.2, matching jsdom's actual requirement ([ba4cea4](https://github.com/codysechelski/codys-dev-tools-two/commit/ba4cea443a6a90d668ef6d77fcf94230884f1588))


### Features

* **release:** add semantic-release pipeline with automated desktop builds ([d31dd0d](https://github.com/codysechelski/codys-dev-tools-two/commit/d31dd0d0079d5f4deeb0a83b736512cb3661a827))
