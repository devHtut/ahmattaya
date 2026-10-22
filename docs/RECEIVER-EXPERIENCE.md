# Receiver experience redesign

Branch: `claude/receiver-experience-polish`. Continues the unfinished receiver UI on `claude/receiver-scroll-redesign` without discarding its changes.

- Compact 16:10 scrapbook canvas shared by editor, gallery and recipient preview. Cover typography uses a small occasion panel and a message panel; additional pages preserve blank/lined options.
- One continuous scroll story: invitation, cover, memory sections, optional interactive 3D cake, closing/replay. Each scene reveals once; next-section links also work with keyboard navigation.
- Opening confetti, floating animated music controls, and existing invitation/cake motion. Reduced-motion preferences disable transitions, confetti and scroll snapping.
- One audio element stays mounted before and after opening. The invitation click starts playback within the user gesture. Replay pauses/resets audio, returns focus and cancels delayed confetti. No claim that candle blowing is implemented.
- Phone audio controls move to the top with 44px targets. Scene/cake widths and heights are bounded; long card text remains scrollable. Font selections, relative sizes, bold, italic and alignment still come from the creator configuration.
- Legacy photo frames are constrained for the landscape display without rewriting saved drafts on load. Move/resize/rotate start from that same displayed frame. Landscape reflow changes the appearance of older portrait compositions; their stored source frames remain untouched until edited.

Validation: tests, lint and production build; browser checks of invitation opening, soundtrack playback (one audio element, readyState 4, playing), mute, section links and cake rendering. Phone 390×844 and tablet 768×1024 were rendered in local iframe viewports for visual review. Physical devices have not been tested. Existing large CakeScene bundle warning remains.

Cloud draft persistence and public publishing are separate unfinished work; this change uses the existing local preview route.
