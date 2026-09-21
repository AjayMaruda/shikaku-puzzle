"use strict";
require("reflect-metadata");
const { IsInt, Min, Max } = require("class-validator");

class CreateBoardDto {
  constructor(data) {
    this.width = Number(data.width);
    this.height = Number(data.height);
  }
}

// Attach validators manually using decorators-compatible approach
CreateBoardDto.validationRules = {
  width: [
    { rule: (v) => Number.isInteger(v), message: "width must be an integer" },
    { rule: (v) => v >= 4, message: "width must be at least 4" },
    { rule: (v) => v <= 12, message: "width must be at most 12" }
  ],
  height: [
    { rule: (v) => Number.isInteger(v), message: "height must be an integer" },
    { rule: (v) => v >= 4, message: "height must be at least 4" },
    { rule: (v) => v <= 12, message: "height must be at most 12" }
  ]
};

function validate(dto) {
  const errors = [];
  for (const [field, rules] of Object.entries(dto.constructor.validationRules || {})) {
    for (const { rule, message } of rules) {
      if (!rule(dto[field])) {
        errors.push({ field, message });
      }
    }
  }
  return errors;
}

module.exports = { CreateBoardDto, validate };
