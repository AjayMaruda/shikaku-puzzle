"use strict";

class PlayerInputDto {
  constructor(data) {
    this.rectangleId = data.rectangleId;
  }
}

PlayerInputDto.validationRules = {
  rectangleId: [
    { rule: (v) => typeof v === "string" && v.length > 0, message: "rectangleId must be a non-empty string" }
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

module.exports = { PlayerInputDto, validate };
