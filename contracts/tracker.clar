(define-constant ERR_SNAPSHOT_EXISTS (err u100))
(define-constant ERR_NO_ACTIVE_SNAPSHOT (err u101))
(define-constant ERR_NOT_READY_TO_COMPLETE (err u102))
(define-constant ERR_BADGE_CONDITION (err u103))
(define-constant ERR_BADGE_ALREADY_CLAIMED (err u104))

(define-constant BADGE_STREAK_3 u1)
(define-constant BADGE_MISSION_FINISHER u2)
(define-constant BADGE_PUBLIC_BUILDER u3)

(define-data-var snapshot-counter uint u0)

(define-map snapshots
  { id: uint }
  {
    id: uint,
    owner: principal,
    mission-label: (string-ascii 48),
    commitment-hash: (buff 32),
    created-at-height: uint,
    due-at-height: uint,
    check-in-count: uint,
    last-proof-hash: (optional (buff 32)),
    last-check-in-height: (optional uint),
    status: (string-ascii 16),
    completed-at-height: (optional uint)
  }
)

(define-map active-snapshot-by-owner principal uint)

(define-map builder-stats
  principal
  {
    total-missions-created: uint,
    missions-completed: uint,
    total-check-ins: uint,
    last-active-height: (optional uint)
  }
)

(define-map profiles
  principal
  {
    owner: principal,
    display-name: (string-ascii 32),
    tagline: (string-ascii 64),
    published-at-height: uint
  }
)

(define-map claimed-badges
  { owner: principal, badge-id: uint }
  {
    badge-id: uint,
    claimed-at-height: uint
  }
)

(define-private (builder-stats-or-default (owner principal))
  (default-to
    {
      total-missions-created: u0,
      missions-completed: u0,
      total-check-ins: u0,
      last-active-height: none
    }
    (map-get? builder-stats owner)
  )
)

(define-private (create-mission-internal
  (mission-label (string-ascii 48))
  (commitment-hash (buff 32))
  (due-at-height uint)
)
  (begin
    (asserts! (is-none (map-get? active-snapshot-by-owner tx-sender)) ERR_SNAPSHOT_EXISTS)
    (let
      (
        (snapshot-id (+ (var-get snapshot-counter) u1))
        (stats (builder-stats-or-default tx-sender))
      )
      (var-set snapshot-counter snapshot-id)
      (map-set snapshots
        { id: snapshot-id }
        {
          id: snapshot-id,
          owner: tx-sender,
          mission-label: mission-label,
          commitment-hash: commitment-hash,
          created-at-height: block-height,
          due-at-height: due-at-height,
          check-in-count: u0,
          last-proof-hash: none,
          last-check-in-height: none,
          status: "active",
          completed-at-height: none
        }
      )
      (map-set active-snapshot-by-owner tx-sender snapshot-id)
      (map-set builder-stats
        tx-sender
        {
          total-missions-created: (+ (get total-missions-created stats) u1),
          missions-completed: (get missions-completed stats),
          total-check-ins: (get total-check-ins stats),
          last-active-height: (some block-height)
        }
      )
      (ok snapshot-id)
    )
  )
)

(define-public (create-mission
  (mission-label (string-ascii 48))
  (commitment-hash (buff 32))
  (due-at-height uint)
)
  (create-mission-internal mission-label commitment-hash due-at-height)
)

(define-public (create-snapshot (commitment-hash (buff 32)) (due-at-height uint))
  (create-mission-internal "legacy-mission" commitment-hash due-at-height)
)

(define-public (check-in (proof-hash (buff 32)))
  (match (map-get? active-snapshot-by-owner tx-sender)
    snapshot-id
      (match (map-get? snapshots { id: snapshot-id })
        snapshot
          (let ((stats (builder-stats-or-default tx-sender)))
            (begin
              (asserts! (is-eq (get status snapshot) "active") ERR_NO_ACTIVE_SNAPSHOT)
              (map-set snapshots
                { id: snapshot-id }
                {
                  id: (get id snapshot),
                  owner: (get owner snapshot),
                  mission-label: (get mission-label snapshot),
                  commitment-hash: (get commitment-hash snapshot),
                  created-at-height: (get created-at-height snapshot),
                  due-at-height: (get due-at-height snapshot),
                  check-in-count: (+ (get check-in-count snapshot) u1),
                  last-proof-hash: (some proof-hash),
                  last-check-in-height: (some block-height),
                  status: "active",
                  completed-at-height: (get completed-at-height snapshot)
                }
              )
              (map-set builder-stats
                tx-sender
                {
                  total-missions-created: (get total-missions-created stats),
                  missions-completed: (get missions-completed stats),
                  total-check-ins: (+ (get total-check-ins stats) u1),
                  last-active-height: (some block-height)
                }
              )
              (ok true)
            )
          )
        ERR_NO_ACTIVE_SNAPSHOT
      )
    ERR_NO_ACTIVE_SNAPSHOT
  )
)

(define-public (complete-mission)
  (match (map-get? active-snapshot-by-owner tx-sender)
    snapshot-id
      (match (map-get? snapshots { id: snapshot-id })
        snapshot
          (let ((stats (builder-stats-or-default tx-sender)))
            (begin
              (asserts!
                (and
                  (is-eq (get status snapshot) "active")
                  (>= (get check-in-count snapshot) u3)
                )
                ERR_NOT_READY_TO_COMPLETE
              )
              (map-set snapshots
                { id: snapshot-id }
                {
                  id: (get id snapshot),
                  owner: (get owner snapshot),
                  mission-label: (get mission-label snapshot),
                  commitment-hash: (get commitment-hash snapshot),
                  created-at-height: (get created-at-height snapshot),
                  due-at-height: (get due-at-height snapshot),
                  check-in-count: (get check-in-count snapshot),
                  last-proof-hash: (get last-proof-hash snapshot),
                  last-check-in-height: (get last-check-in-height snapshot),
                  status: "completed",
                  completed-at-height: (some block-height)
                }
              )
              (map-delete active-snapshot-by-owner tx-sender)
              (map-set builder-stats
                tx-sender
                {
                  total-missions-created: (get total-missions-created stats),
                  missions-completed: (+ (get missions-completed stats) u1),
                  total-check-ins: (get total-check-ins stats),
                  last-active-height: (some block-height)
                }
              )
              (ok true)
            )
          )
        ERR_NO_ACTIVE_SNAPSHOT
      )
    ERR_NO_ACTIVE_SNAPSHOT
  )
)

(define-public (publish-profile
  (display-name (string-ascii 32))
  (tagline (string-ascii 64))
)
  (begin
    (map-set profiles
      tx-sender
      {
        owner: tx-sender,
        display-name: display-name,
        tagline: tagline,
        published-at-height: block-height
      }
    )
    (ok true)
  )
)

(define-public (claim-badge (badge-id uint))
  (let
    (
      (stats (builder-stats-or-default tx-sender))
      (profile (map-get? profiles tx-sender))
    )
    (begin
      (asserts!
        (is-none (map-get? claimed-badges { owner: tx-sender, badge-id: badge-id }))
        ERR_BADGE_ALREADY_CLAIMED
      )
      (asserts!
        (if (is-eq badge-id BADGE_STREAK_3)
          (>= (get total-check-ins stats) u3)
          (if (is-eq badge-id BADGE_MISSION_FINISHER)
            (>= (get missions-completed stats) u1)
            (if (is-eq badge-id BADGE_PUBLIC_BUILDER)
              (and
                (>= (get total-check-ins stats) u7)
                (is-some profile)
              )
              false
            )
          )
        )
        ERR_BADGE_CONDITION
      )
      (map-set claimed-badges
        { owner: tx-sender, badge-id: badge-id }
        {
          badge-id: badge-id,
          claimed-at-height: block-height
        }
      )
      (ok true)
    )
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

(define-read-only (get-active-mission (owner principal))
  (get-active-snapshot owner)
)

(define-read-only (get-profile (owner principal))
  (map-get? profiles owner)
)

(define-read-only (get-builder-stats (owner principal))
  (builder-stats-or-default owner)
)

(define-read-only (has-badge (owner principal) (badge-id uint))
  (is-some (map-get? claimed-badges { owner: owner, badge-id: badge-id }))
)
