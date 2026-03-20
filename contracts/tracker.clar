(define-constant ERR_SNAPSHOT_EXISTS (err u100))
(define-constant ERR_NO_ACTIVE_SNAPSHOT (err u101))

(define-data-var snapshot-counter uint u0)

(define-map snapshots
  { id: uint }
  {
    id: uint,
    owner: principal,
    commitment-hash: (buff 32),
    created-at-height: uint,
    due-at-height: uint,
    check-in-count: uint,
    last-proof-hash: (optional (buff 32)),
    last-check-in-height: (optional uint)
  }
)

(define-map active-snapshot-by-owner principal uint)

(define-public (create-snapshot (commitment-hash (buff 32)) (due-at-height uint))
  (begin
    (asserts! (is-none (map-get? active-snapshot-by-owner tx-sender)) ERR_SNAPSHOT_EXISTS)
    (let ((snapshot-id (+ (var-get snapshot-counter) u1)))
      (var-set snapshot-counter snapshot-id)
      (map-set snapshots
        { id: snapshot-id }
        {
          id: snapshot-id,
          owner: tx-sender,
          commitment-hash: commitment-hash,
          created-at-height: block-height,
          due-at-height: due-at-height,
          check-in-count: u0,
          last-proof-hash: none,
          last-check-in-height: none
        }
      )
      (map-set active-snapshot-by-owner tx-sender snapshot-id)
      (ok snapshot-id)
    )
  )
)

(define-public (check-in (proof-hash (buff 32)))
  (match (map-get? active-snapshot-by-owner tx-sender)
    snapshot-id
      (match (map-get? snapshots { id: snapshot-id })
        snapshot
          (begin
            (map-set snapshots
              { id: snapshot-id }
              {
                id: (get id snapshot),
                owner: (get owner snapshot),
                commitment-hash: (get commitment-hash snapshot),
                created-at-height: (get created-at-height snapshot),
                due-at-height: (get due-at-height snapshot),
                check-in-count: (+ (get check-in-count snapshot) u1),
                last-proof-hash: (some proof-hash),
                last-check-in-height: (some block-height)
              }
            )
            (ok true)
          )
        ERR_NO_ACTIVE_SNAPSHOT
      )
    ERR_NO_ACTIVE_SNAPSHOT
  )
)

(define-read-only (get-snapshot (snapshot-id uint))
  (map-get? snapshots { id: snapshot-id })
)

(define-read-only (get-snapshot-id-by-owner (owner principal))
  (map-get? active-snapshot-by-owner owner)
)

(define-read-only (get-active-snapshot (owner principal))
  (match (map-get? active-snapshot-by-owner owner)
    snapshot-id (map-get? snapshots { id: snapshot-id })
    none
  )
)
