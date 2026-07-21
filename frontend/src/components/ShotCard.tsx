import { getObjectName } from './astroData'
import styles from './AstroBase.module.css'
import type { AstroShot } from './types'

type ShotCardProps = {
  shot: AstroShot
  onOpen: (shotId: number) => void
}

export function ShotCard({ shot, onOpen }: ShotCardProps) {
  const objectName = shot.objectName ?? getObjectName(shot.objectId)

  return (
    <article className={styles.shotCard}>
      <button type="button" className={styles.shotCardButton} onClick={() => onOpen(shot.id)}>
        <img className={styles.shotImage} src={shot.image} alt={shot.title} loading="lazy" />

        <div className={styles.shotInfo}>
          <div>
            <p className={styles.shotObject}>{objectName}</p>
            <h2>{shot.title}</h2>
            <p className={styles.shotMeta}>{shot.author}</p>
          </div>

          <div className={styles.shotMiniGrid} aria-label="Параметры фото">
            <p>
              <span>Лайки</span>
              <strong>{shot.likes}</strong>
            </p>
            <p>
              <span>Локация</span>
              <strong>{shot.location}</strong>
            </p>
          </div>
        </div>
      </button>
    </article>
  )
}
