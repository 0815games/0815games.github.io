// [2026-02-16 12:30:00] game_render_3d.js - WebGL Renderer Fixed (Lighting & Visibility)

Object.assign(Game, {
    // --- THREE.JS GLOBALS ---
    scene: null,
    camera: null,
    renderer: null,
    composer: null,
    playerMesh: null,
    walls: [],
    
    // Config
    TILE_SIZE: 1, 
    
    // Materials
    mats: {},

    // Override Init: Startet Three.js
    initCanvas: function() {
        const cvs = document.getElementById('game-canvas');
        if(!cvs) return;
        const viewContainer = document.getElementById('view-container');
        
        // 1. Scene Setup
        this.scene = new THREE.Scene();
        // Leichter Nebel (startet erst ab Distanz 2, damit man die Füße sieht)
        this.scene.fog = new THREE.Fog(0x050505, 2, 15); 
        this.scene.background = new THREE.Color(0x050505); // Sehr dunkles Grau statt Schwarz

        const aspect = viewContainer.clientWidth / viewContainer.clientHeight;
        this.camera = new THREE.PerspectiveCamera(60, aspect, 0.1, 100);
        
        // 2. Renderer Setup
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: cvs, 
            antialias: true, // Antialias an für schärfere Kanten
            powerPreference: "high-performance"
        });
        this.renderer.setSize(viewContainer.clientWidth, viewContainer.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // 3. Post-Processing (BLOOM) - Mit Fehler-Check
        try {
            const renderScene = new THREE.RenderPass(this.scene, this.camera);
            
            // Bloom Parameter angepasst (weniger aggressiv)
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(viewContainer.clientWidth, viewContainer.clientHeight),
                1.0, 0.4, 0.85
            );
            bloomPass.threshold = 0.1;
            bloomPass.strength = 0.8; 
            bloomPass.radius = 0.2;

            this.composer = new THREE.EffectComposer(this.renderer);
            this.composer.addPass(renderScene);
            this.composer.addPass(bloomPass);
        } catch(e) {
            console.warn("Bloom Shader Error:", e);
            this.composer = null; // Fallback auf normalen Renderer
        }

        // 4. Init Materials & World
        this.initMaterials();

        // 5. AMBIENT LIGHT (Sicherheits-Licht)
        // Das sorgt dafür, dass nichts komplett schwarz ist
        const ambientLight = new THREE.AmbientLight(0x404040, 1.5); 
        this.scene.add(ambientLight);

        // 6. Start Loop
        if(this.loopId) cancelAnimationFrame(this.loopId);
        this.drawLoop();
        
        console.log("WebGL Renderer Fixed & Initialized");
    },

    initMaterials: function() {
        const texLoader = new THREE.TextureLoader();
        
        // Textur Generator (Heller für bessere Sichtbarkeit)
        const createNoiseTexture = (colorHex) => {
            const size = 64;
            const canvas = document.createElement('canvas');
            canvas.width = size; canvas.height = size;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = colorHex;
            ctx.fillRect(0,0,size,size);
            
            for(let i=0; i<300; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)';
                ctx.fillRect(Math.random()*size, Math.random()*size, 2, 2);
            }
            const tex = new THREE.CanvasTexture(canvas);
            tex.magFilter = THREE.NearestFilter;
            tex.minFilter = THREE.NearestFilter;
            return tex;
        };

        // Material heller machen
        this.mats.wall = new THREE.MeshStandardMaterial({ 
            map: createNoiseTexture('#555555'), // Helleres Grau
            roughness: 0.6, 
            metalness: 0.2 
        });
        
        this.mats.floor = new THREE.MeshStandardMaterial({ 
            map: createNoiseTexture('#333333'), // Hellerer Boden
            roughness: 0.8,
            metalness: 0.1
        });

        this.mats.vault = new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xffff00, emissiveIntensity: 1 });
        this.mats.enemy = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 0.8 });
        this.mats.loot = new THREE.MeshStandardMaterial({ color: 0x39ff14, emissive: 0x39ff14, emissiveIntensity: 0.6 });
    },

    renderStaticMap: function() {
        if(!this.scene) return;
        
        // Scene leeren (außer Licht)
        this.scene.children = this.scene.children.filter(c => c.isLight); // Behalte Lichter

        if(!this.state.currentMap) return;

        const geoWall = new THREE.BoxGeometry(this.TILE_SIZE, this.TILE_SIZE * 1.5, this.TILE_SIZE);
        const geoFloor = new THREE.PlaneGeometry(this.TILE_SIZE, this.TILE_SIZE);
        
        const mapW = this.MAP_W;
        const mapH = this.MAP_H;

        const worldGroup = new THREE.Group();
        this.scene.add(worldGroup);

        for(let y=0; y<mapH; y++) {
            for(let x=0; x<mapW; x++) {
                const type = this.state.currentMap[y][x];
                const px = x * this.TILE_SIZE;
                const pz = y * this.TILE_SIZE;

                // BODEN
                const floor = new THREE.Mesh(geoFloor, this.mats.floor);
                floor.rotation.x = -Math.PI / 2;
                floor.position.set(px, 0, pz);
                floor.receiveShadow = true;
                worldGroup.add(floor);

                // WÄNDE & OBJEKTE
                if(type === '#') {
                    const wall = new THREE.Mesh(geoWall, this.mats.wall);
                    wall.position.set(px, this.TILE_SIZE * 0.75, pz);
                    wall.castShadow = true;
                    wall.receiveShadow = true;
                    worldGroup.add(wall);
                }
                else if(type === 'V') { 
                    const v = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16), this.mats.vault);
                    v.position.set(px, 0.1, pz);
                    worldGroup.add(v);
                }
                else if(['M', 'W'].includes(type)) {
                    const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 8), this.mats.enemy);
                    m.position.set(px, 0.5, pz);
                    worldGroup.add(m);
                }
                else if(['X', 'B', 't', 'T'].includes(type)) {
                    const l = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.3), this.mats.loot);
                    l.position.set(px, 0.2, pz);
                    worldGroup.add(l);
                }
            }
        }

        this.createPlayer();
    },

    createPlayer: function() {
        this.playerMesh = new THREE.Group();
        
        // DEBUG CUBE (Damit du siehst wo der Spieler ist, falls Licht ausfällt)
        // const debugCube = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshBasicMaterial({color: 0x00ff00, wireframe: true}));
        // this.playerMesh.add(debugCube);
        
        // TASCHENLAMPE (Breiter und Heller)
        const spotLight = new THREE.SpotLight(0xffffee, 3, 20, Math.PI / 4, 0.5, 1);
        spotLight.position.set(0, 3, 0); 
        spotLight.target.position.set(0, 0, -4); 
        spotLight.castShadow = true;
        
        // WICHTIG: Shadow Bias gegen Artefakte
        spotLight.shadow.bias = -0.0001; 
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;

        this.playerMesh.add(spotLight);
        this.playerMesh.add(spotLight.target);
        
        this.scene.add(this.playerMesh);
    },

    draw: function() {
        if(!this.renderer || !this.scene || !this.playerMesh) return;
        
        const cvs = this.renderer.domElement;
        // Auto-Resize
        if (cvs.width !== cvs.clientWidth || cvs.height !== cvs.clientHeight) {
            const w = cvs.clientWidth;
            const h = cvs.clientHeight;
            this.renderer.setSize(w, h, false);
            if(this.composer) this.composer.setSize(w, h);
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        }

        // Spieler-Position syncen
        const targetX = this.state.player.x * this.TILE_SIZE;
        const targetZ = this.state.player.y * this.TILE_SIZE;
        
        // Lerp (Bewegungsglättung)
        this.playerMesh.position.x += (targetX - this.playerMesh.position.x) * 0.2;
        this.playerMesh.position.z += (targetZ - this.playerMesh.position.z) * 0.2;
        
        // Rotation korrigieren (Game Rot ist 2D Radian, 3D braucht Mapping)
        this.playerMesh.rotation.y = -this.state.player.rot + Math.PI; 

        // Kamera folgt Spieler
        // Leicht schräg von oben (Top Down RPG Style)
        this.camera.position.x = this.playerMesh.position.x;
        this.camera.position.z = this.playerMesh.position.z + 5; 
        this.camera.position.y = 7; 
        this.camera.lookAt(this.playerMesh.position.x, 0, this.playerMesh.position.z);

        // Rendern (Fallback falls Composer fehlt)
        if(this.composer) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    },

    // Compatibility Stubs
    initCache: function() {},
    drawText: function() {}
});
