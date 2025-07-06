// src/components/RatingIcon.jsx
import React from 'react';
import { FaRegSmileBeam, FaRegSmile, FaRegMeh, FaRegFrown, FaRegAngry } from 'react-icons/fa';

const ratingMap = {
  5: { icon: <FaRegSmileBeam />, colorClass: 'rating-5' },
  4: { icon: <FaRegSmile />, colorClass: 'rating-4' },
  3: { icon: <FaRegMeh />, colorClass: 'rating-3' },
  2: { icon: <FaRegFrown />, colorClass: 'rating-2' },
  1: { icon: <FaRegAngry />, colorClass: 'rating-1' },
};

const RatingIcon = ({ value, name, selectedValue, onChange }) => {
  const isSelected = parseInt(value, 10) === selectedValue;
  const { icon, colorClass } = ratingMap[value];

  return (
    <label className="rating-icon">
      <input
        type="radio"
        name={name}
        value={value}
        checked={isSelected}
        onChange={onChange}
        required
      />
      {/* This span will now always render the icon */}
      <span className={`icon-display ${isSelected ? colorClass : ''}`}>
        {icon}
      </span>
    </label>
  );
};

export default RatingIcon;