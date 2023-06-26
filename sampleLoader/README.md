## Overview
This utility provides an example of importing a non-trivial XLSX file into a Hyperformula instance and measures the performance and memory overhead of serializing/deserializing the state of an instance.

Additionally, the utility demonstrates an approach to reconciling the resulting Hyperformula instance against the original excel file (note that the comparison logic is messy and still has issues -- for example, dates are erroneously reported as unequal in some cases)

To allow for working around incompatibilities with Excel, a JSON file may be provided to specify alternative interpretation of specific cells in the source document when added to Hyperformula. 

### Usage
`node cli.js <path-to-xlsx> [measure | compare] [path-to-settings-json]`

### Settings file format
```
{
  "overrides": {
   // Regular expression replacement based on cell value using sheet-level variables 
    "replacements": [
      {
        // Regular expression (with capturing groups) to compare against cell formula
        "regex": "MID\\(@?CELL\\(\"filename\"\\),FIND\\(\"]\",CELL\\(\"filename\"\\)\\)\\+1,256\\)",
        
        // Replacement expressions (using {} for variable references)
        "replacement": "\"{SHEET_NAME}\"", // SHEET_NAME is a special variable that does not need an explicit value defined.
        "variables": {
        }
      },
      {
        "regex": "(([a-zA-Z0-9]+)|('[^']+'))!\\$1:\\$1048576",
        "replacement": "$1!$$A$$1:$${MAX_COLUMN}$$10000",
        // Mapping of variable names to indices of capturing groups.  The value of the capture group at 
        // the specified index is looked up against the variableValues property (below) matching the variable name.
        // If found, the value associated with the captured value is used, if not, the value associated with "__default" 
        // is used.  
        "variables": {
          "MAX_COLUMN": 0
        }
      }
    ],
    "variableValues": {
      "MAX_COLUMN": {
        "__default": "Z",
        "Sheet2": "L"
      }
    },
    
    // Sheet/Cell specific overrides
    "Sheet1": {
      "B6": "SUM(B3:B5)-B5"
    }
  }
}
```