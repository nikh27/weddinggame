import * as THREE from 'three'

const MAT = {
  white:  new THREE.MeshStandardMaterial({ color:0xf9f7f1, roughness:0.8 }),
  black:  new THREE.MeshStandardMaterial({ color:0x2c2a33, roughness:0.68 }),
  eyeW:   new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.3 }),
  eyeB:   new THREE.MeshStandardMaterial({ color:0x14121a, roughness:0.2 }),
  nose:   new THREE.MeshStandardMaterial({ color:0x201d26, roughness:0.4 }),
  blush:  new THREE.MeshStandardMaterial({ color:0xff9e9e, roughness:0.9, transparent:true, opacity:0.55 }),
  pengBody:new THREE.MeshStandardMaterial({ color:0x33313d, roughness:0.7 }),
  pengBlack:new THREE.MeshStandardMaterial({ color:0x262430, roughness:0.6 }),
  pengWing:new THREE.MeshStandardMaterial({ color:0x3b3849, roughness:0.5 }),
  pengBelly:new THREE.MeshStandardMaterial({ color:0xfbf9f3, roughness:0.82 }),
  orange: new THREE.MeshStandardMaterial({ color:0xf6a02a, roughness:0.5 }),
  orangeD:new THREE.MeshStandardMaterial({ color:0xd9761f, roughness:0.6 }),
}

function makeEye(radius){
  const eye = new THREE.Group()
  const w = new THREE.Mesh(new THREE.SphereGeometry(radius,16,16), MAT.eyeW)
  const p = new THREE.Mesh(new THREE.SphereGeometry(radius*0.62,16,16), MAT.eyeB)
  p.position.z = radius*0.55
  const h = new THREE.Mesh(new THREE.SphereGeometry(radius*0.22,8,8), new THREE.MeshBasicMaterial({color:0xffffff}))
  h.position.set(radius*0.22, radius*0.28, radius*0.8)
  eye.add(w,p,h)
  return eye
}

function makeLimb(geo, mat, length){
  const pivot = new THREE.Group()
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  mesh.position.y = -length/2
  pivot.add(mesh)
  return pivot
}

function makeBow(){
  const g = new THREE.Group()
  const pink  = new THREE.MeshStandardMaterial({ color:0xff5fa2, roughness:0.35 })
  const pinkD = new THREE.MeshStandardMaterial({ color:0xe23f86, roughness:0.45 })
  const loopGeo = new THREE.ConeGeometry(0.26, 0.5, 18)
  const L = new THREE.Mesh(loopGeo, pink)
  L.rotation.z = -Math.PI/2
  L.position.set(-0.2,0,0)
  L.scale.set(1,1,0.55)
  L.castShadow=true
  const R = new THREE.Mesh(loopGeo, pink)
  R.rotation.z =  Math.PI/2
  R.position.set( 0.2,0,0)
  R.scale.set(1,1,0.55)
  R.castShadow=true
  g.add(L,R)
  const knot = new THREE.Mesh(new THREE.SphereGeometry(0.12,16,14), pinkD)
  knot.scale.set(1,1.35,0.9)
  knot.castShadow=true
  g.add(knot)
  const tailGeo = new THREE.ConeGeometry(0.1,0.42,12)
  const t1 = new THREE.Mesh(tailGeo, pink)
  t1.position.set(-0.12,-0.32,0)
  t1.rotation.z = 0.35
  t1.scale.set(1,1,0.55)
  const t2 = new THREE.Mesh(tailGeo, pink)
  t2.position.set( 0.12,-0.32,0)
  t2.rotation.z = -0.35
  t2.scale.set(1,1,0.55)
  g.add(t1,t2)
  return g
}

function makeGlasses(){
  const g = new THREE.Group()
  const frameMat = new THREE.MeshStandardMaterial({ color:0x3a3842, roughness:0.5, metalness:0.1 })
  const lensMat  = new THREE.MeshStandardMaterial({ color:0xe6f1ff, roughness:0.05, transparent:true, opacity:0.22 })
  const R = 0.28, tube = 0.025
  function lens(x){
    const grp = new THREE.Group()
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, tube, 14, 32), frameMat)
    const glass = new THREE.Mesh(new THREE.CircleGeometry(R-0.02, 28), lensMat)
    glass.position.z = -0.006
    grp.add(ring, glass)
    grp.position.x = x
    grp.scale.y = 0.85
    return grp
  }
  g.add(lens(-0.31), lens(0.31))
  const bridge = new THREE.Mesh(new THREE.CylinderGeometry(tube*0.85, tube*0.85, 0.1, 10), frameMat)
  bridge.rotation.z = Math.PI/2
  bridge.position.y = 0.04
  g.add(bridge)
  const armGeo = new THREE.CylinderGeometry(tube*0.7, tube*0.7, 0.65, 8)
  const aL = new THREE.Mesh(armGeo, frameMat)
  aL.rotation.x = Math.PI/2
  aL.position.set(-0.62, 0.0, -0.3)
  const aR = aL.clone()
  aR.position.x = 0.62
  g.add(aL, aR)
  return g
}

export function buildPanda(){
  const root = new THREE.Group()
  const parts = {}
  root.parts = parts

  const body = new THREE.Group(); parts.body = body
  // White lower belly
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 22), MAT.white)
  torso.scale.set(1, 1.15, 0.92)
  torso.castShadow = true
  body.add(torso)
  
  // Black upper shoulders and chest (organic vest)
  const chest = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 22), MAT.black)
  chest.scale.set(1.02, 0.52, 0.94) 
  chest.position.y = 0.48
  body.add(chest)

  body.position.y = 1.18
  root.add(body)

  const head = new THREE.Group(); parts.head = head
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.92, 28, 24), MAT.white)
  skull.castShadow = true
  head.add(skull)
  head.position.y = 2.55
  root.add(head)

  const earGeo = new THREE.SphereGeometry(0.34, 16, 16)
  const earL = new THREE.Mesh(earGeo, MAT.black)
  earL.castShadow = true
  earL.position.set(-0.62, 0.72, -0.05)
  earL.scale.set(1,1,0.7)
  const earR = earL.clone()
  earR.position.x = 0.62
  head.add(earL, earR)
  
  const patchGeo = new THREE.SphereGeometry(0.3, 20, 18)
  const patchL = new THREE.Mesh(patchGeo, MAT.black)
  patchL.scale.set(1, 1, 0.5)
  patchL.position.set(-0.28, 0.04, 0.78)
  const patchR = patchL.clone()
  patchR.position.x = 0.28
  head.add(patchL, patchR)

  const eyeL = makeEye(0.11); eyeL.position.set(-0.28, 0.04, 0.86)
  const eyeR = makeEye(0.11); eyeR.position.set( 0.28, 0.04, 0.86)
  head.add(eyeL, eyeR)

  const muzzle = new THREE.Mesh(new THREE.SphereGeometry(0.34,16,16), MAT.white)
  muzzle.scale.set(1.15,0.85,0.75)
  muzzle.position.set(0,-0.3,0.78)
  head.add(muzzle)
  
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.12,14,14), MAT.nose)
  nose.scale.set(1.4,0.8,0.9)
  nose.position.set(0,-0.22,1.02)
  head.add(nose)
  
  // Cute bear 'w' mouth
  const mouth = new THREE.Group()
  const mHalf = new THREE.TorusGeometry(0.07, 0.018, 10, 20, Math.PI)
  const mL = new THREE.Mesh(mHalf, MAT.nose)
  mL.rotation.z = Math.PI
  mL.position.set(-0.07, 0, 0)
  const mR = new THREE.Mesh(mHalf, MAT.nose)
  mR.rotation.z = Math.PI
  mR.position.set(0.07, 0, 0)
  mouth.add(mL, mR)
  mouth.position.set(0, -0.32, 1.04)
  mouth.rotation.x = 0.2
  head.add(mouth)
  
  const tongue = new THREE.Mesh(
    new THREE.SphereGeometry(0.04, 14, 12),
    new THREE.MeshStandardMaterial({ color:0xff7d99, roughness:0.55 })
  )
  tongue.scale.set(1.2, 0.5, 0.6)
  tongue.position.set(0, -0.38, 1.05)
  head.add(tongue)
  
  const blushL = new THREE.Mesh(new THREE.CircleGeometry(0.12,16), MAT.blush)
  blushL.position.set(-0.55,-0.24,0.72)
  blushL.rotation.y = 0.4
  const blushR = blushL.clone()
  blushR.position.x = 0.55
  blushR.rotation.y = -0.4
  head.add(blushL, blushR)

  const armGeo = new THREE.CylinderGeometry(0.24,0.2,0.95,12)
  const armL = makeLimb(armGeo, MAT.black, 0.95); armL.position.set(-1.0, 1.65, 0)
  const armR = makeLimb(armGeo, MAT.black, 0.95); armR.position.set( 1.0, 1.65, 0)
  ;[armL,armR].forEach(a=>{ 
    const paw=new THREE.Mesh(new THREE.SphereGeometry(0.26,14,14),MAT.black)
    paw.position.y=-0.95; paw.castShadow=true; a.add(paw) 
  })
  root.add(armL, armR)

  const legGeo = new THREE.CylinderGeometry(0.3,0.28,0.7,12)
  const legL = makeLimb(legGeo, MAT.black, 0.7); legL.position.set(-0.5, 0.62, 0)
  const legR = makeLimb(legGeo, MAT.black, 0.7); legR.position.set( 0.5, 0.62, 0)
  ;[legL,legR].forEach(l=>{ 
    const foot=new THREE.Mesh(new THREE.SphereGeometry(0.32,14,14),MAT.black)
    foot.scale.set(1,0.7,1.3); foot.position.set(0,-0.7,0.12); foot.castShadow=true; l.add(foot) 
  })
  root.add(legL, legR)

  const glasses = makeGlasses()
  glasses.position.set(0, 0.04, 1.0)
  head.add(glasses)

  root.userData = { kind:'panda', radius:1.3, height:3.95, baseY:0.32, headBaseY:2.55, rightArm: armR, swingArm:[armL,armR], swingLeg:[legL,legR], head, body, waddle:0.04, walkPhase:0, moveAmt:0 }
  return root
}

export function buildPenguin(){
  const root = new THREE.Group()
  const parts = {}
  root.parts = parts

  const BLACK = MAT.pengBlack, WHITE = MAT.pengBelly

  const body = new THREE.Group(); parts.body = body
  const torso = new THREE.Mesh(new THREE.SphereGeometry(1.0, 32, 26), BLACK)
  torso.scale.set(0.82, 1.22, 0.8)
  torso.castShadow = true
  body.add(torso)
  
  const belly = new THREE.Mesh(new THREE.SphereGeometry(0.96, 30, 24), WHITE)
  belly.scale.set(0.72, 1.18, 0.66)
  belly.position.set(0, -0.04, 0.28)
  body.add(belly)
  body.position.y = 1.28
  root.add(body)

  const head = new THREE.Group(); parts.head = head
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.84, 30, 26), BLACK)
  skull.scale.set(1.0, 0.98, 0.96)
  skull.castShadow = true
  head.add(skull)
  head.position.y = 2.35
  root.add(head)

  const face = new THREE.Mesh(new THREE.SphereGeometry(0.72, 32, 26), WHITE)
  face.scale.set(1.08, 1.0, 0.46)
  face.position.set(0, -0.04, 0.48)
  head.add(face)

  function pengEye(side){
    const e = new THREE.Group()
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 24, 24), MAT.eyeB)
    b.scale.set(1, 1, 0.62)
    e.add(b)
    const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 12), new THREE.MeshBasicMaterial({color:0xffffff}))
    h1.position.set(side*-0.05, 0.06, 0.12)
    e.add(h1)
    const h2 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), new THREE.MeshBasicMaterial({color:0xffffff}))
    h2.position.set(side*0.06, -0.05, 0.12)
    e.add(h2)
    e.position.set(side*0.25, 0.04, 0.76)
    return e
  }
  const eyeL = pengEye(-1), eyeR = pengEye(1)
  head.add(eyeL, eyeR)

  const blushMat = new THREE.MeshStandardMaterial({ color:0xff9ab3, roughness:0.9, transparent:true, opacity:0.75 })
  const blL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 16), blushMat)
  blL.scale.set(1.4, 0.8, 0.4)
  blL.position.set(-0.4, -0.15, 0.80)
  blL.rotation.y = -0.3
  blL.rotation.z = 0.1
  const blR = blL.clone()
  blR.position.x = 0.4
  blR.rotation.y = 0.3
  blR.rotation.z = -0.1
  head.add(blL, blR)

  const beautyMark = new THREE.Mesh(new THREE.SphereGeometry(0.02, 8, 8), MAT.black)
  beautyMark.position.set(0.35, -0.32, 0.77)
  head.add(beautyMark)

  const beak = new THREE.Group()
  // Upper beak: wide, soft, slightly curved down
  const beakUp = new THREE.Mesh(new THREE.SphereGeometry(0.14, 16, 16), MAT.orange)
  beakUp.scale.set(1.5, 0.65, 1.3)
  beakUp.position.set(0, 0, 0)
  beakUp.rotation.x = 0.15
  beakUp.castShadow = true

  // Lower beak: slightly smaller, darker orange, tucked under
  const beakDn = new THREE.Mesh(new THREE.SphereGeometry(0.11, 16, 16), MAT.orangeD)
  beakDn.scale.set(1.2, 0.5, 1.1)
  beakDn.position.set(0, -0.09, -0.02)
  beakDn.rotation.x = 0.25
  beakDn.castShadow = true

  // Tiny pink tongue/mouth visible between them
  const innerMouth = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 14, 12),
    new THREE.MeshStandardMaterial({ color:0xff5d7d, roughness:0.5 })
  )
  innerMouth.scale.set(1.3, 0.4, 0.8)
  innerMouth.position.set(0, -0.04, 0.05)

  beak.add(beakUp, beakDn, innerMouth)
  beak.position.set(0, -0.22, 0.84)
  head.add(beak)

  function makeWing(side){
    const pivot = new THREE.Group()
    const w = new THREE.Mesh(new THREE.SphereGeometry(0.56, 20, 16), MAT.pengWing)
    w.scale.set(0.34, 1.05, 0.66)
    w.position.y = -0.55
    w.castShadow = true
    pivot.add(w)
    pivot.position.set(side*0.85, 1.86, 0.16)
    pivot.rotation.z = side*0.42
    pivot.rotation.x = -0.18
    return pivot
  }
  const wingL = makeWing(-1), wingR = makeWing(1)
  root.add(wingL, wingR)

  function makeFoot(side){
    const pivot = new THREE.Group()
    const foot = new THREE.Group()
    const base = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), MAT.orange)
    base.scale.set(1.25, 0.34, 1.25)
    base.position.z = 0.08
    base.castShadow = true
    foot.add(base)
    for (let i=-1; i<=1; i++){
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.11, 12, 10), MAT.orange)
      toe.scale.set(1, 0.32, 1.25)
      toe.position.set(i*0.14, 0, 0.3)
      toe.castShadow = true
      foot.add(toe)
    }
    pivot.add(foot)
    pivot.position.set(side*0.34, 0.07, 0.05)
    return pivot
  }
  const footL = makeFoot(-1), footR = makeFoot(1)
  root.add(footL, footR)

  const headBow = makeBow()
  headBow.scale.setScalar(0.45)
  headBow.position.set(-0.45, 0.62, 0.35)
  headBow.rotation.set(-0.2, 0.4, -0.2)
  head.add(headBow)

  const bow = makeBow()
  bow.scale.setScalar(0.7)
  bow.position.set(0, 0.95, 0.62)
  bow.rotation.x = 0.12
  body.add(bow)

  root.userData = { kind:'penguin', radius:1.0, height:3.2, baseY:0, headBaseY:2.35, rightArm: wingR, swingArm:[wingL,wingR], swingLeg:[footL,footR], head, body, waddle:0.12, walkPhase:0, moveAmt:0 }
  return root
}

export function animateCharacter(c, dt, time) {
  const u = c.userData
  const amt = u.moveAmt
  // Reduced walk cycle speed from 9 to 6.5 to match slower movement speed
  u.walkPhase += dt * 6.5 * (0.15 + amt)
  const ph = u.walkPhase
  const swing = Math.sin(ph) * (0.15 + amt*0.65)
  
  if (u.swingLeg) { 
    u.swingLeg[0].rotation.x = swing
    u.swingLeg[1].rotation.x = -swing
  }
  
  if (u.swingArm) {
    if (u.kind === 'penguin'){
      const flap = Math.abs(Math.sin(ph)) * amt * 0.5
      u.swingArm[0].rotation.z =  0.18 + flap
      u.swingArm[1].rotation.z = -0.18 - flap
      u.swingArm[0].rotation.x = -swing*0.6
      u.swingArm[1].rotation.x =  swing*0.6
    } else {
      u.swingArm[0].rotation.x = -swing*1.1
      u.swingArm[1].rotation.x = swing*1.1
    }
  }
  
  const bob = Math.abs(Math.sin(ph)) * amt * 0.12
  const idleBreath = Math.sin(time*1.6) * 0.03 * (1-amt)
  
  c.position.y = (u.baseY||0) + bob
  c.rotation.z = Math.sin(ph) * u.waddle * amt
  
  if (u.head) { 
    u.head.rotation.z = Math.sin(ph*0.5)*0.04*amt
    u.head.position.y = u.headBaseY + idleBreath 
  }
  if (u.body) { 
    u.body.scale.y = 1 + idleBreath*0.5 
  }
}
