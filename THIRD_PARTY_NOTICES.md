# Third-party notices

This package bundles or depends on the following third-party works.

## Magpie (yetone/magpie)

- Project: https://github.com/yetone/magpie
- License: MIT
- What is used:
  - The plugin talks to a locally running Magpie instance (model-router
    gateway) through its CLI and HTTP gateway.
  - The `webui/` directory is a copy of Magpie's own web front-end assets
    (originally `internal/gui/assets/` in the Magpie repository) so the DSH
    workspace panel can render the exact Magpie UI. The files are redistributed
    unmodified, under Magpie's MIT license.
  - `icon.png` is Magpie's web app icon (`icons/apple-touch-icon.png`).

Magpie's MIT license text:

```
MIT License

Copyright (c) yetone

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

If you redistribute this plugin, keep this notice and the `webui/` attribution.
