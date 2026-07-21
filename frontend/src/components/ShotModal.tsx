import { getObjectName } from './astroData'
import styles from './AstroBase.module.css'
import type { AstroShot } from './types'

type ShotModalProps = {
  shot: AstroShot
  onClose: () => void
}

export function ShotModal({ shot, onClose }: ShotModalProps) {
  const objectName = shot.objectName ?? getObjectName(shot.objectId)

  return (
    <div className={styles.shotModalBackdrop} role="presentation" onClick={onClose}>
      <div
        className={styles.shotModal}
        role="dialog"
        aria-modal="true"
        aria-label={shot.title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={styles.shotModalMedia}>
          <img className={styles.shotModalImage} src={shot.image} alt={shot.title} />
        </div>

        <div className={styles.shotModalInfo}>
          <div className={styles.shotObjectRow}>
            <p className={styles.shotObject}>{objectName}</p>
            <button
              type="button"
              className={styles.shotModalClose}
              onClick={onClose}
              aria-label="Закрыть модальное окно"
            >
              X
            </button>
          </div>

          <h3>{shot.title}</h3>
          <p className={styles.shotMeta}>Автор: {shot.author}</p>

          <div className={styles.shotModalSpecs}>
            <p><span>Лайки</span><strong>{shot.likes}</strong></p>
            <p><span>Телескоп</span><strong>{shot.telescope}</strong></p>
            <p><span>Камера</span><strong>{shot.camera}</strong></p>
            <p><span>Координаты</span><strong>{shot.coordinates}</strong></p>
            <p><span>Локация</span><strong>{shot.location}</strong></p>
          </div>

          <p className={styles.shotModalDescription}>{shot.description}</p>
        </div>
      </div>
    </div>
  )
}
