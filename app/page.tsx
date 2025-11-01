'use client';

import { useState, useEffect } from 'react';

export default function Home() {
  return (
    <div className='flex min-h-screen items-center justify-center bg-gray-100 font-sans'>
      <Clock />
    </div>
  );
}

/**
 * A helper function to get the current time parts for a specific timezone.
 * Uses the browser's built-in Intl.DateTimeFormat to reliably handle
 * timezones and Daylight Saving Time without any external libraries.
 * @param {string} timeZone - IANA timezone name (e.g., 'Europe/Warsaw')
 * @param {Date} date - The date object to format
 * @returns {object} - An object { hour, minute, second }
 */
const getTimeForTimeZone = (timeZone, date) => {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timeZone,
      hour12: false,
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    }).formatToParts(date);

    const getValue = (type) => {
      const part = parts.find((p) => p.type === type);
      return part ? parseInt(part.value) : 0;
    };

    const hour = getValue('hour');
    return {
      hour: hour === 24 ? 0 : hour, // Handle midnight
      minute: getValue('minute'),
      second: getValue('second'),
    };
  } catch (e) {
    console.error(`Invalid timeZone: ${timeZone}`, e);
    // Fallback to local time
    return {
      hour: date.getHours(),
      minute: date.getMinutes(),
      second: date.getSeconds(),
    };
  }
};

/**
 * The individual clock hand component.
 * It's a container that rotates, with the image positioned inside.
 */
const Hand = ({ type, rotation, imgSrc = '', alt, isSecondHand = false }) => {
  let zIndex, handLength, colorFilter, offset;

  switch (type) {
    case 'cet-hour':
      zIndex = 37;
      handLength = '35%'; // 35% of clock diameter
      // colorFilter = 'invert(37%) sepia(93%) saturate(1352%) hue-rotate(184deg) brightness(99%) contrast(101%)'; // Blue
      colorFilter = ''; // Blue
      offset = 30; // Offset for hour hands
      break;
    case 'eet-hour':
      zIndex = 36;
      handLength = '35%'; // 28% of clock diameter - shorter
      // colorFilter = 'invert(48%) sepia(79%) saturate(2476%) hue-rotate(86deg) brightness(118%) contrast(119%)'; // Green
      colorFilter = ''; // Green
      offset = 30; // Same offset as CET hour hand
      break;
    case 'second':
      zIndex = 40;
      handLength = '42%'; // Longer for visibility
      colorFilter = '';
      offset = 0;
      break;
    case 'minute':
    default:
      zIndex = 38;
      handLength = '40%'; // 40% of clock diameter
      // colorFilter = 'invert(27%) sepia(51%) saturate(2878%) hue-rotate(346deg) brightness(104%) contrast(97%)'; // Red
      colorFilter = ''; // Red
      offset = 17.5; // Different offset for minute hand
      break;
  }

  if (isSecondHand) {
    // Simple black line for second hand - vertical orientation
    return (
      <div
        className='absolute'
        style={{
          height: handLength,
          width: '2px',
          backgroundColor: '#000',
          top: '50%',
          left: '50%',
          transformOrigin: 'bottom center',
          transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
          zIndex: zIndex,
        }}
      />
    );
  }

  // For image-based hands (horizontal images that need to point from center outward)
  // Offset to align the round base of the hand with the clock center
  return (
    <div
      className='absolute flex items-center'
      style={{
        width: handLength,
        height: '50px',
        top: '50%',
        left: '50%',
        transformOrigin: `${offset}px center`,
        transform: `translate(-${offset}px, -50%) rotate(${rotation}deg)`,
        zIndex: zIndex,
      }}
    >
      <img
        src={imgSrc}
        alt={alt}
        style={{
          width: '100%',
          height: 'auto',
          maxHeight: '100%',
          objectFit: 'contain',
          filter: colorFilter,
        }}
      />
    </div>
  );
};

/**
 * The main Clock component
 */
const Clock = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Update the time every second
    const intervalId = setInterval(() => {
      setTime(new Date());
    }, 1000);

    // Clear interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // --- Timezone Calculations ---
  // Note: We get seconds for smooth hand movement, even though no second hand is shown
  const cetTime = getTimeForTimeZone('Europe/Warsaw', time); // Central Europe
  const eetTime = getTimeForTimeZone('Europe/Athens', time); // South Europe (e.g., Greece)

  // Use CET time for shared minutes/seconds
  const { minute, second } = cetTime;

  // --- Rotation Calculations ---
  // The -90deg offset is because 0deg in CSS transform is at the 3 o'clock
  // position, but we want 0 to be at 12 o'clock (subtract 90 to rotate counterclockwise).
  const CSS_OFFSET = -90;

  // Calculate rotation for the second hand (6 degrees per second)
  const secondRotation = (second / 60) * 360 + CSS_OFFSET;

  // Calculate rotation for the minute hand
  // (second / 60) * 6 gives the smooth sweep
  const minuteRotation = (minute / 60) * 360 + (second / 60) * 6 + CSS_OFFSET;

  // Calculate rotation for the CET hour hand
  // (cetTime.hour % 12) gives 12-hour format
  // (minute / 60) * 30 makes the hour hand move smoothly between hours
  const cetHourRotation =
    ((cetTime.hour % 12) / 12) * 360 + (minute / 60) * 30 + CSS_OFFSET;

  // Calculate rotation for the EET hour hand
  const eetHourRotation =
    ((eetTime.hour % 12) / 12) * 360 + (minute / 60) * 30 + CSS_OFFSET;

  return (
    <div
      className='relative w-[90vw] max-w-sm aspect-square bg-cover bg-center rounded-full shadow-2xl'
      style={{ backgroundImage: "url('dial.png')" }}
    >
      {/* The center pivot dot */}
      <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-black rounded-full z-50'></div>

      {/* --- Clock Hands --- */}
      <Hand
        type='cet-hour'
        rotation={cetHourRotation}
        imgSrc='hourCET.png'
        alt='Central Europe Hour Hand'
      />
      <Hand
        type='eet-hour'
        rotation={eetHourRotation}
        imgSrc='hourEET.png'
        alt='South Europe Hour Hand'
      />
      <Hand
        type='minute'
        rotation={minuteRotation}
        imgSrc='minute.png'
        alt='Minute Hand'
      />
      <Hand
        type='second'
        rotation={secondRotation}
        isSecondHand={true}
        alt='Second Hand'
      />
    </div>
  );
};
