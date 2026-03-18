// @ts-check

import eslintPlugin from "@eslint/js";
import { defineConfig } from "@eslint/config-helpers";
import tseslintPlugin from "typescript-eslint";
import mochaPlugin from "eslint-plugin-mocha";
import packageJsonPlugin from "eslint-plugin-package-json";
import stylisticTs from "@stylistic/eslint-plugin-ts";
import { importX } from "eslint-plugin-import-x";

const ignorePatterns = ["dist", "**/*.d.ts", "node_modules/"];

/**
 * @typedef {import('typescript-eslint').ConfigWithExtends} Config
 */

/**
 * Generates an ESLint configuration tailored for package.json files.
 *
 * @param {Object} options - The configuration options.
 * @param {Config["rules"]} [options.rules] - Custom ESLint rules to apply to package.json files.
 * @returns {Config} The ESLint configuration object.
 */
const packageJson = ({ rules = {} } = {}) => {
    return {
        extends: [packageJsonPlugin.configs.recommended],
        rules: {
            "package-json/valid-local-dependency": 0,
            ...rules,
        },
    };
};

/**
 * Generates an ESLint configuration tailored for mocha test files.
 *
 * @param {Object} options - The configuration options.
 * @param {string[]} [options.files] - Glob patterns to specify which test files to lint.
 * @param {Config["rules"]} [options.rules] - Custom ESLint rules to apply to test files using mocha.
 * @returns {Config} The ESLint configuration object.
 */
const mocha = ({ files = ["**/*.test.ts"], rules = {} } = {}) => {
    return {
        files,
        extends: [mochaPlugin.configs.flat.recommended],
        rules: {
            "mocha/no-mocha-arrows": 0,
            /** TODO: remove the following warning (needed to not break the upgrade) */
            // Need to check why mocha complaing about this rules
            "@typescript-eslint/no-unused-expressions": "off",
            "mocha/no-setup-in-describe": "off",
            "mocha/no-exports": "off",
            "@typescript-eslint/no-unsafe-function-type": "off",
            ...rules,
        },
    };
};

/**
 * Generates an ESLint configuration tailored for typecript files. (uses eslint and typescript-eslint rules)
 *
 * @param {Object} options - The configuration options.
 * @param {string[]} [options.files] - Glob patterns to specify which test files to lint.
 * @param {boolean} [options.commonjs] - Flag to indicate if it's to make commonjs compliant.
 * @param {string} [options.tsconfigPath] - Flag to indicate if it's to make commonjs compliant.
 * @param {Config["rules"]} [options.rules] - Custom ESLint rules to apply to test files using mocha.
 * @returns {Config} The ESLint configuration object.
 */
const typescript = ({ files = ["**/*.ts"], rules = {}, tsconfigPath = "" } = {}) => {
    return {
        files,
        plugins: {
            "@stylistic/ts": stylisticTs,
        },
        settings: {
            "import-x/ignore": [
                "cmf-lbos",
                "nconf",
                "node-hid",
                "iconv",
                "validator",
                "amqplib",
                "mssql",
                "mysql",
                "papaparse",
                "fs-extra",
                "chokidar",
                "winston",
                "xpath",
                "mathjs"
            ],
        },
        languageOptions: {
            parserOptions: {
                tsconfigRootDir: tsconfigPath,
            },
        },
        extends: [
            eslintPlugin.configs.recommended,
            tseslintPlugin.configs.recommended,
            importX.flatConfigs.recommended,
            importX.flatConfigs.typescript,
        ],
        rules: {
            "import-x/no-commonjs": "error",
            "import-x/no-default-export": "error",
            "import-x/no-namespace": "error",
            // TODO: this rule has conflits with our current pipeline
            // npmBuild depends on npmLint, so some packages are not build yet
            "import-x/no-unresolved": "off",
            "@typescript-eslint/consistent-type-imports": "error",
            "prefer-spread": "off",
            "no-multi-spaces": "error",
            "no-trailing-spaces": "error",
            "no-console": [
                "error",
                {
                    allow: ["warn", "error"],
                },
            ],
            eqeqeq: [
                "error",
                "always",
                {
                    null: "ignore",
                },
            ],
            "no-constant-condition": [
                "error",
                {
                    checkLoops: false,
                },
            ],
            "no-var": "error",
            "no-irregular-whitespace": "error",
            curly: "error",
            semi: "error",
            "no-unused-expressions": "off",
            "no-unused-vars": "off",
            "no-undef": "off",
            "no-prototype-builtins": "off",
            quotes: "off",
            "no-case-declarations": "off",
            "no-shadow": "off",
            "no-empty": "off",
            //"no-sync": "warn",
            "@typescript-eslint/no-inferrable-types": "off",
            "@typescript-eslint/no-namespace": "off",
            // deprecated "@typescript-eslint/ban-types": "error",
            "@typescript-eslint/no-non-null-assertion": "off",
            "@typescript-eslint/no-empty-function": [
                "error",
                {
                    allow: [
                        "functions",
                        "methods",
                        "asyncFunctions",
                        "asyncMethods",
                        "arrowFunctions",
                    ],
                },
            ],
            "@typescript-eslint/no-shadow": "error",
            "@typescript-eslint/prefer-for-of": "error",
            "@typescript-eslint/consistent-type-assertions": "error",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/member-ordering": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    args: "none",
                },
            ],
            "@typescript-eslint/no-this-alias": "off",
            /* deprecated (requires ESLint Stylistic) */
            "@stylistic/ts/quotes": [
                "error",
                "double",
                {
                    avoidEscape: true,
                    allowTemplateLiterals: true,
                },
            ],
            "@typescript-eslint/naming-convention": [
                "error",
                {
                    selector: ["class", "interface"],
                    types: ["string"],
                    format: ["PascalCase"],
                },
            ],
            /** TODO: remove the following warning (needed to not break the upgrade) */
            // Need to check why mocha complaing about this rules
            "@typescript-eslint/no-unused-expressions": "off",
            // Code with require (commonjs) is still valid on our codebase
            // After migration to ESM we need to change to "error"
            "@typescript-eslint/no-require-imports": "off",
            // Should type our functions (TODO: change to warn)
            "@typescript-eslint/no-unsafe-function-type": "off",
            // Prevent use of empty object types (TODO: change to warn)
            "@typescript-eslint/no-empty-object-type": "off",
            // Prevents use of confusing built-in primitive class wrappers.
            "@typescript-eslint/no-wrapper-object-types": "warn",
            ...rules,
        },
    };
};

export const overrides = {
    ts: {
        "no-case-declarations": "off",
        "prefer-rest-params": "off",
        "prefer-const": "off",
        "@typescript-eslint/no-inferrable-types": "off",
        "@typescript-eslint/explicit-module-boundary-types": "off",
        "@typescript-eslint/consistent-type-assertions": "off",
        "@typescript-eslint/no-shadow": "off",
    },
};

export { ignorePatterns, typescript, packageJson, mocha, defineConfig };
