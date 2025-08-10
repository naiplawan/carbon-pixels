# Sound Effects for Carbon Pixels Notification System

This directory contains audio files used for notification feedback and achievement celebrations in the Thailand Waste Diary app.

## Required Sound Files

The notification system expects the following audio files to be present in this directory:

### Achievement Sounds
- `achievement.mp3` - General achievement unlocked sound (triumphant, positive)
- `level-up.mp3` - Level progression sound (ascending musical phrase)
- `streak.mp3` - Streak milestone sound (energetic, motivating)
- `celebrate.mp3` - Major milestone celebration (festive, exciting)

### Feedback Sounds
- `success.mp3` - Successful action completion (gentle positive chime)
- `gentle-chime.mp3` - Soft reminder notification (unobtrusive, calming)
- `challenge.mp3` - Daily challenge notification (encouraging, upbeat)

### Optional Sounds
- `info.mp3` - Information notification (neutral tone)
- `warning.mp3` - Warning notification (gentle alert)
- `error.mp3` - Error notification (subtle negative feedback)

## Sound Requirements

### Technical Specifications
- **Format**: MP3 (for broad browser compatibility)
- **Duration**: 0.5 - 3.0 seconds maximum
- **File Size**: Keep under 50KB per file for fast loading
- **Sample Rate**: 44.1kHz recommended
- **Bit Rate**: 128kbps or higher for quality

### Audio Design Guidelines
- **Volume**: Mastered to consistent levels, not too loud
- **Tone**: Positive and encouraging for achievements, gentle for reminders
- **Cultural Sensitivity**: Appropriate for Thai users, avoid overly Western sounds
- **Accessibility**: Clear and distinct for users with hearing differences

## Usage in Code

The notification system automatically loads these sounds based on filename:

```typescript
const soundMap = {
  'achievement': '/sounds/achievement.mp3',
  'success': '/sounds/success.mp3',
  'gentle-chime': '/sounds/gentle-chime.mp3',
  'level-up': '/sounds/level-up.mp3',
  'streak': '/sounds/streak.mp3',
  'celebrate': '/sounds/celebrate.mp3',
  'challenge': '/sounds/challenge.mp3'
};
```

## Implementation Notes

1. **Graceful Degradation**: The app continues to work if sound files are missing
2. **User Control**: All sounds can be disabled via notification settings
3. **Performance**: Sounds are loaded only when needed (not preloaded)
4. **Browser Support**: Uses HTML5 Audio API with error handling

## Sound Sources

For licensing compliance, use sounds from:
- **Free Sources**: Freesound.org, Zapsplat (free tier), BBC Sound Effects Library
- **Creative Commons**: Ensure CC0 or CC-BY licensing
- **Custom Creation**: Original compositions for unique branding
- **Commercial Libraries**: Pond5, AudioJungle (ensure proper licensing)

## Testing

Test sounds across different:
- **Devices**: Desktop, mobile, tablet
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Environments**: Quiet and noisy settings
- **User Scenarios**: Achievement unlocking, daily reminders, level progression

## Accessibility Considerations

- Provide visual alternatives for deaf/hard-of-hearing users
- Ensure sounds are not essential for app functionality
- Consider users with sound sensitivities (volume control)
- Test with screen readers and assistive technologies

## Future Enhancements

Potential sound features to consider:
- **Spatial Audio**: 3D positioning for immersive experience
- **Adaptive Volume**: Automatically adjust based on environment
- **Sound Themes**: Different sound packs (nature, electronic, traditional Thai)
- **Voice Notifications**: Spoken achievement announcements (Thai/English)
- **Haptic Feedback**: Vibration patterns for mobile devices

## Installation Instructions

1. Add your MP3 files to this directory
2. Ensure filenames match exactly (case-sensitive)
3. Test sounds in notification settings
4. Verify fallback behavior when sounds are missing

The notification system will automatically detect and use available sound files while gracefully handling missing ones.