const mongoose = require("mongoose");

const RectangleSchema = new mongoose.Schema({
  id: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  locked: { type: Boolean, default: false },
  clueValue: { type: Number, required: true },
  selected: { type: Boolean, default: false }
});

const ClueSchema = new mongoose.Schema({
  row: { type: Number, required: true },
  col: { type: Number, required: true },
  value: { type: Number, required: true }
});

const GameSchema = new mongoose.Schema(
  {
    boardId: { type: String, required: true, unique: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    clues: [ClueSchema],
    rectangles: [RectangleSchema],
    selectedRectangleId: { type: String, default: null },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    solved: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Game", GameSchema);
