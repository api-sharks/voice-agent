Real whisper.cpp WASM artifacts:

- stream.js       — whisper.cpp examples/stream.wasm emscripten build (single file,
                    WASM embedded, pthread-based). From https://ggml.ai/whisper.cpp/stream.wasm/
                    (commit df7638d8, MIT license).
- ggml-tiny.bin   — multilingual Whisper tiny model in ggml format. From
                    https://huggingface.co/ggerganov/whisper.cpp

stream.js requires cross-origin isolation (SharedArrayBuffer). The dev server sets
Cross-Origin-Opener-Policy / Cross-Origin-Embedder-Policy headers via angular.json;
production hosting must set the same headers.

API (embind): Module.init(modelPath, lang) -> instance, Module.set_audio(instance,
Float32Array @16kHz), Module.get_transcribed() (poll), Module.get_status(),
Module.set_status(text), Module.free(instance).
