import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";

export default [
    {
        ignores: [
            "dist/",
            "build/",
            "node_modules/",
        ],
    },

    js.configs.recommended,

    {
        files: ["**/*.{js,jsx}"],

        languageOptions: {
            ecmaVersion: "latest",
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,
            },
            parserOptions: {
                ecmaFeatures: {
                    jsx: true,
                },
            },
        },

        plugins: {
            react,
            "react-hooks": reactHooks,
        },

        settings: {
            react: {
                version: "detect",
            },
        },

        rules: {
            "no-unused-vars": "error",

            "react/jsx-uses-react": "off",
            "react/jsx-uses-vars": "error",

            "react-hooks/rules-of-hooks": "error",
            "react-hooks/exhaustive-deps": "warn",
        },
    },
];