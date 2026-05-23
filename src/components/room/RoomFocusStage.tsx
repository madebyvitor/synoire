import { motion } from 'motion/react'
import { RoomSessionFooter } from '@/components/room/RoomSessionFooter'
import { RoomTimerRing } from '@/components/room/RoomTimerRing'
import type { FocusCycle } from '@/lib/hubRooms/types'
import type { RoomPhase } from '@/lib/roomTimer'
import {
  pageFloatItem,
  pageStaggerContainer,
  pageStaggerItem,
} from '@/motion/pageStagger'

type RoomFocusStageProps = {
  phase: RoomPhase
  remainingSeconds: number
  segmentDuration: number
  focusCycle: FocusCycle
  prefersReducedMotion: boolean
  chromeClass: string
  timerRitualFade: boolean
  isPlaying: boolean
}

export function RoomFocusStage({
  phase,
  remainingSeconds,
  segmentDuration,
  focusCycle,
  prefersReducedMotion,
  chromeClass,
  timerRitualFade,
  isPlaying,
}: RoomFocusStageProps) {
  const staggerC = pageStaggerContainer(prefersReducedMotion)
  const staggerItem = pageStaggerItem(prefersReducedMotion)
  const floatItem = pageFloatItem(prefersReducedMotion)

  return (
    <>
      <motion.div
        key="focus-stage"
        className="relative z-10 flex min-h-dvh flex-col items-center justify-center px-6 pb-28 pt-16"
        variants={staggerC}
        initial={prefersReducedMotion ? false : 'hidden'}
        animate="visible"
      >
        <motion.div
          variants={floatItem}
          className="relative w-full max-w-md"
        >
          <motion.div variants={staggerItem}>
            <RoomTimerRing
              phase={phase}
              remainingSeconds={remainingSeconds}
              segmentDuration={segmentDuration}
              timerRitualFade={timerRitualFade}
              prefersReducedMotion={prefersReducedMotion}
            />
          </motion.div>
        </motion.div>
      </motion.div>

      <RoomSessionFooter
        phase={phase}
        focusCycle={focusCycle}
        isPlaying={isPlaying}
        chromeClass={chromeClass}
        prefersReducedMotion={prefersReducedMotion}
      />
    </>
  )
}
