# CMake file for VS Code Simple Coding Time Tracker
# This provides cross-platform cleanup utilities for test artifacts

cmake_minimum_required(VERSION 3.16)
project(VSCodeSimpleCodingTimeTracker)

# Set Node.js and npm commands
if(WIN32)
    set(NPM_CMD "npm.cmd")
    set(NODE_CMD "node.exe")
else()
    set(NPM_CMD "npm")
    set(NODE_CMD "node")
endif()

# Custom target to clean test artifacts
add_custom_target(clean-test-files
    COMMAND ${NODE_CMD} scripts/cleanup-test-files.js
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Cleaning up test generated files and temporary artifacts"
)

# Custom target to clean compiled output
add_custom_target(clean-compiled
    COMMAND ${CMAKE_COMMAND} -E rm -rf out/
    COMMAND ${CMAKE_COMMAND} -E rm -rf dist/
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Cleaning up compiled JavaScript files"
)

# Custom target to clean node modules and reinstall
add_custom_target(clean-deps
    COMMAND ${CMAKE_COMMAND} -E rm -rf node_modules/
    COMMAND ${CMAKE_COMMAND} -E rm -f package-lock.json
    COMMAND ${NPM_CMD} install
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Cleaning and reinstalling dependencies"
)

# Custom target to reset VS Code test cache
add_custom_target(reset-vscode-test
    COMMAND ${CMAKE_COMMAND} -E rm -rf .vscode-test/
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Resetting VS Code test runner cache"
)

# Custom target for complete cleanup
add_custom_target(clean-all
    DEPENDS clean-test-files clean-compiled reset-vscode-test
    COMMENT "Complete cleanup of all generated files"
)

# Custom target to run tests after cleanup
add_custom_target(test-clean
    COMMAND ${CMAKE_COMMAND} --build . --target clean-test-files
    COMMAND ${NPM_CMD} run compile-tests
    COMMAND ${NPM_CMD} test
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Clean test artifacts and run fresh tests"
)

# Custom target to build TypeScript
add_custom_target(build
    COMMAND ${NPM_CMD} run compile
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Compiling TypeScript source"
)

# Custom target to build tests specifically
add_custom_target(build-tests
    COMMAND ${NPM_CMD} run compile-tests
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Compiling TypeScript tests"
)

# Custom target to run tests
add_custom_target(test
    COMMAND ${NPM_CMD} test
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Running test suite"
)

# Custom target to watch and run tests
add_custom_target(test-watch
    COMMAND ${NPM_CMD} run test:watch
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Running tests in watch mode"
)

# Custom target to package extension
add_custom_target(package
    COMMAND ${NPM_CMD} run package
    WORKING_DIRECTORY ${CMAKE_SOURCE_DIR}
    COMMENT "Packaging VS Code extension"
)

# Help target
add_custom_target(help
    COMMAND ${CMAKE_COMMAND} -E echo "Available targets:"
    COMMAND ${CMAKE_COMMAND} -E echo "  clean-test-files  - Remove test generated files and artifacts"
    COMMAND ${CMAKE_COMMAND} -E echo "  clean-compiled    - Remove compiled JavaScript files"
    COMMAND ${CMAKE_COMMAND} -E echo "  clean-deps        - Clean and reinstall node dependencies"
    COMMAND ${CMAKE_COMMAND} -E echo "  reset-vscode-test - Reset VS Code test runner cache"
    COMMAND ${CMAKE_COMMAND} -E echo "  clean-all         - Complete cleanup of all generated files"
    COMMAND ${CMAKE_COMMAND} -E echo "  test-clean        - Clean and run fresh tests"
    COMMAND ${CMAKE_COMMAND} -E echo "  build             - Compile TypeScript source"
    COMMAND ${CMAKE_COMMAND} -E echo "  build-tests       - Compile TypeScript tests"
    COMMAND ${CMAKE_COMMAND} -E echo "  test              - Run test suite"
    COMMAND ${CMAKE_COMMAND} -E echo "  test-watch        - Run tests in watch mode"
    COMMAND ${CMAKE_COMMAND} -E echo "  package           - Package VS Code extension"
    COMMAND ${CMAKE_COMMAND} -E echo "  help              - Show this help message"
    COMMENT "Available CMake targets for VS Code extension development"
)

# Make help the default target
add_custom_target(default DEPENDS help)
