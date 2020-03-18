// file simple_extension/main.js

define([
    'base/js/namespace'
], function (
    Jupyter
) {
    function load_ipython_extension() {

        // Lines annotated with this prefix will be retrieved
        var robota_suffix = "!robota";

        /* Defines each validator which can be applied. Each value should correspond
        *  an object with keys name, operator, num_inputs, description, example and func.
        *
        * The function's first parameter is reserved for the line being validated.
        * Thereafter, any additional parameters may be specified. Each function must return a boolean.
        *
        * num_inputs should _EXCLUDE_ the first parameter in its count. So, if a validator only takes the line,
        * this should be 0.
        */
        var validators = [
            {
                name: "different",
                description: "Checks that the value of the line is different from something.",
                num_inputs: 1,
                operator: "!=",
                example: "!=:1",
                func: function (line, value) {
                    return line !== value;
                }
            }
        ];

        /**
         * Given a notebook object (obtained as Jupyter.notebook), returns a list of all the CodeCell objects contained
         * therein.
         * @param notebook {Notebook} - The Jupyter notebook object
         * @returns Array{CodeCell} - The list of code cells contained in the notebook
         */
        var get_all_code_cells = function (notebook) {

            let cells = notebook.get_cells();

            return cells.filter(c => c.class_config.classname === "CodeCell")
        };

        /**
         * Given a code cell, executes robota automated feedback. That is, it executes the appropriate
         * validation(s)/instruction(s) against each row annotated with robota_suffix
         * @param code_cell {CodeCell} - The code_cell object that should be validated.
         */
        var execute_cell_annotations = function (code_cell) {
            let feedback_separator = "\n# **Feedback**\n";
            let raw_content = code_cell.get_text();
            content = raw_content.split(feedback_separator)[0]
            let lines = content.split("\n");
            // Selecting those lines which contain the robota suffix
            let annotated_lines = lines.filter(l => l.includes(robota_suffix));
            let all_validation_results = annotated_lines.map(l => validate_line(l))
            code_cell.set_text(content + feedback_separator);
            all_validation_results.forEach(
                avr => avr.forEach(
                    vr => code_cell.set_text(code_cell.get_text() + "# " + vr.message + "\n")
                )
            );
        };

        /**
         * Given an annotated line, executes the specified robota annotation(s) against it.
         * @param annotated_line {string} - The annotated line
         */
        var validate_line = function (annotated_line) {
            let line_tokens = annotated_line.split(robota_suffix);
            let line_input = line_tokens[0].replace("#", "").trim();
            let robota_annotation = line_tokens.pop();
            let annotation_tokens = robota_annotation.split(":").filter(t => t !== "")
            let validators = parse_annotation_tokens(annotation_tokens);

            // create function
            let executor = function (line, f, parameters, name) {
                let is_valid = f(line, ...parameters);
                return {
                    is_valid: is_valid,
                    message: `Validator ${name} gave result ${is_valid} for parameters ${parameters}.`
                };
            };

            let validation_results = validators.map(v => executor(
                line_input,
                v["validator_function"],
                v["parameters"],
                v["name"]
            ));

            return validation_results;
        };

        /**
         * Given a list of annotation tokens (Eg: ["!=", "1"]) returns a list of objects
         * where each object contains the validator's name, its function and parameters for that specific execution.
         *
         * Eg: ["!=", 1]
         *
         * Produces
         *
         * {
         *     name: "different",
         *     parameters: [1],
         *     validator_function: _The function object associated to the validator_
         * }
         *
         * It disregards unknown validators or validators where the right number of inputs has not been provided
         * @param tokens Array{string} - The list of tokens
         * @returns Array{object[]} - The aforementioned list of objects.
         */
        var parse_annotation_tokens = function (tokens) {
            // Holds the generated objects. that will be applied to the annotated line
            let objects = [];
            // Holds the object corresponding to the current validator
            let validator = null;
            // Holds the parameters being applied to the validator
            let parameters = [];

            let next_token = null;

            do {

                next_token = tokens.shift();

                let next_validator = validators.find(v => v.operator === next_token);

                if (validator == null && next_validator == null) {

                    // First token is not a validator, can't do anything
                    console.log("Invalid start character!");
                    return objects;

                } else if (next_validator != null && validator == null) {

                    // First character is a validator, assign it
                    validator = next_validator;

                } else if ((next_validator != null || next_token == null) && validator != null) {

                    // We have a validator but found another one. Or, we
                    // have a validator and this is the last token. Create function from current and
                    // get ready to process next.
                    if (parameters.length != validator["num_inputs"]) {
                        console.log(`${validator.operator} expects ${validator.num_inputs} inputs,` +
                            `but ${parameters.length} were found. Skipping.`);
                        continue
                    }

                    let generated_object = {
                        validator_function: validator["func"],
                        parameters: parameters,
                        name : validator["name"]
                    };

                    objects.push(generated_object);

                    validator = next_validator;
                    next_validator = null;
                    parameters = [];


                } else if (next_validator == null && validator != null) {

                    // We have a validator but haven't found a new one, so we must have a parameter.
                    parameters.push(next_token);

                }

            } while (next_token != null || validator != null);

            return objects;
        };

        var handler = function () {
            console.log("robota here");
            code_cells = get_all_code_cells(Jupyter.notebook);
            code_cells.forEach(c => execute_cell_annotations(c))
        };

        var action = {
            icon: 'fa-check-circle-o',
            help: 'Run RoboTA Feedback',
            help_index: 'rta',
            handler: handler
        };
        var prefix = 'robota_autofeedback';
        var action_name = 'run-robota';

        var full_action_name = Jupyter.actions.register(action, action_name, prefix);
        Jupyter.toolbar.add_buttons_group([full_action_name]);
    }

    return {
        load_ipython_extension: load_ipython_extension
    };
});
