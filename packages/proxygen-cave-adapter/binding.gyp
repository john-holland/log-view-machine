{
  "targets": [
    {
      "target_name": "proxygen_cave_native",
      "sources": ["addon/binding.cc", "addon/cave_server.cc", "addon/normalized_marshal.cc"],
      "include_dirs": [
        "addon",
        "<!@(node -p \"require('node-addon-api').include\")"
      ],
      "dependencies": ["<!(node -p \"require('node-addon-api').gyp\")"],
      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],
      "xcode_settings": {
        "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
        "CLANG_CXX_LIBRARY": "libc++"
      },
      "msvs_settings": {
        "VCCLCompilerTool": { "ExceptionHandling": 1 }
      },
      "conditions": [
        ["OS=='win'", { "defines": ["_HAS_EXCEPTIONS=1"] }]
      ]
    }
  ]
}
