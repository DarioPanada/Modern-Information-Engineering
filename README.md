# Modern Information Engineering With Automated Feedback

Sample of Jupyter notebook automated feedback on a sample of the Modern Information Engineering material from The University of Manchester.

## Rationale

As students learn programming they are often assigned a set of exercises that take the form of "code templates" they have to edit.

Our extension allows the annotation of specific lines to provide automated feedback on what they should or should not look like. Eg: A line should be different from something, a line should introduce a for loop, etc.

## Quick Documentation

Annotations are added as inline comments to the line that should be validated.

Each annotation should star with `!robota`, followed by validator(s) and parameter(s). Each token, whether it is a validator or a parameter, is separated by a semi-colon. `(:)`

Sample:

`a = 1 #!robota:!=:a = 1` 

Checks that the line is different from *a = 1*. Note *a = 1* is a parameter to the validator `!=`.

`for x in [1,2,3]: #!robota:is_for`

Check that the line introduces a for loop. In this case, *is_for* takes no parameters.

`x = 1 #!robota:any:x = 1:x = 2:x = 3`

Checks that the line is equal to any of *x = 1*, *x = 2* or *x = 3*.

`if x == 1: #!robota:is_conditional:!=:if x == 2:`

Checks that the line is a conditional and different from *if x == 2:

## Adding Validators

Validators should be added in `robota.js` as objects to the `validators` list.

A sample validator is provided below.

            {

                name: "different",
                description: "Checks that the value of the line is different from something.",
                num_inputs: 1,
                operator: "!=",
                example: "!robota:!=:1",
                func: function (line, value) {
                    return line !== value;
                }
            }
            
The following keys should be included:

* **name** (string) - The validator's name;
* **description** (string) - A short description of what the validator does;
* **num_inputs** (int | "any") - The number of parameters the validator takes. It should be 0 if the validator doesn't take any. It can be set to *any* (string) to allow any number of parameters;
* **example** (string) - A sample usage in the notebook;
* **func** (function : string, any* -> bool) - A function that will take the line as an input, the additional parameters (if any) and return a boolean which indicates if the line is valid with regards to the validator.

Note, where *num_inputs* is any, a function signature as follows might be more appropriate:

    func: function(line, ...values) {
                    return values.some(v => v === line);
    }
    
As per Javascript specifications, the spread operator (...) means any additional parameter passed to the function will be added to an array assigned to the variable *values*. In the example above, the array function *some* is used to check if the line is equal to any of the parameters.  

## Running the Demo

### Cloud demo (recommended)

Click the button to launch a cloud notebook with the extension installed.
[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/DarioPanada/Modern-Information-Engineering/master)

Might take **up to 15 minutes** to launch the first time!

### Running locally

We assume Jupyter is installed.

Requires Python 3.6

`
sudo add-apt-repository ppa:deadsnakes/ppa
sudo apt update
sudo apt install python3.6`

Install ipkernel under python3.6

`python3.6 -m pip install ipykernel
python3.6 -m ipykernel install --user`

Install nbextensions

`sudo python3.6 -m pip install jupyter_contrib_nbextensions
sudo python3.6 -m jupyter contrib nbextension install`

Then, **from within the project folder**, run:

`jupyter nbextension install robota_autofeedback/robota.js --user
jupyter nbextension enable robota --user`
