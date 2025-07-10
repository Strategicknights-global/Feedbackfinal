// src/components/RatingIcon.jsx
import React from 'react';
import { FaRegSmileBeam, FaRegSmile, FaRegMeh, FaRegFrown, FaRegAngry } from 'react-icons/fa';

// The map now only contains the icon component.
const ratingIconMap = {
  5: FaRegSmileBeam,
  4: FaRegSmile,
  3: FaRegMeh,
  2: FaRegFrown,
  1: FaRegAngry,
};

const RatingIcon = ({ value, name, selectedValue, onChange }) => {
  const isSelected = parseInt(value, 10) === selectedValue;
  const IconComponent = ratingIconMap[value];

  // We add the color class directly based on the value for styling.
  const colorClass = `rating-${value}`;

  return (
    <label className="rating-cell">
      <input
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        onChange={onChange}
        required
      />
      {/* The number and icon are now together */}
      <div className={`rating-display ${isSelected ? `selected ${colorClass}` : ''}`}>
        <span className="rating-number">{value}</span>
        <IconComponent className="icon-face" />
      </div>
    </label>
  );
};

export default RatingIcon;