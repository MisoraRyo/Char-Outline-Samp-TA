/////////////////////////////////////////////////////////////////////////
///// IMPORT
import './style.css'
// Textalive関連
import Songs from './song.json'; //プロコン用の楽曲データ
import { Player } from "textalive-app-api";
// Three.js関連
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import Stats from "three/examples/jsm/libs/stats.module";
import GUI, { FunctionController } from 'lil-gui';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import Typeface from '../static/ZenOldMincho_Regular_min.json';
// Animation用
import { gsap } from "gsap";


// GUIの初期設定
const gui = new GUI({width:180});
gui.domElement.id = 'gui';
gui.close();

// Three.js でテキストを生成するために必要なフォントデータを読み込む
const fontLoader = new FontLoader();
const Ffont  = fontLoader.parse(Typeface);


window.onload = function(){

/////////////////////////////////////////////////////////////////////////
///// 
///// TextAlive-Api
///// 
///// 
/////////////////////////////////////////////////////////////////////////

//TextAlive_APi初期化
const player = new Player({
    // Interface PlayerOptions
    // https://developer.textalive.jp/packages/textalive-app-api/interfaces/PlayerOptions.html
    //
    app: { 
      token: "★★★★★",//Token　★★★★★取得したトークンを追加ください！！！★★★★
      parameters: [
      ]
    },
    mediaElement: document.querySelector("#media"),
    vocalAmplitudeEnabled : true,/*歌声の声量*/
    valenceArousalEnabled : true,/*感情値*/

    //fontFamilies: ["kokoro"], // null <= すべてのフォントを読み込む
    //lyricsFetchTimeout:1000, //
    //throttleInterval:10, //アップデート関数の発行間隔をしていする。ミリセカンド。
    //mediaBannerPosition:"top", //音源メディアの情報を表示する位置を指定する。座標指定ではない。
});

//★デバック時のみ[0~100]
player.volume = 10;

/////////////////////////////////////////

//テキストのグローバル変数
let nowChar = "";
let nowWord = "";
let nowPhrase = "";
//曲の長さ&終了処理をする
let endTime = 0;
let voiceEndTime = 0;
//最大声量
let MaxVocal = 0;
let SongVocal = 0; //0~1の値

let BeatInterval = 0;

//場面構成
let SEGMENTS=[];
let nowSegment = 0;//曲のいまのセグメントを管理するグローバル変数


// リスナの登録 / Register listeners
player.addListener({

    onAppReady: (app) => {
      if (!app.managed) {
        player.createFromSongUrl( Songs[0].url, Songs[0].data);
  
        // 
        // 生きること / nogumi feat. 初音ミク
        // player.createFromSongUrl("https://piapro.jp/t/fnhJ/20230131212038", {
        //    video: {
        //     // 音楽地図訂正履歴: https://songle.jp/songs/2245018/history
        //     beatId: 4267300,
        //     chordId: 2405033,
        //     repetitiveSegmentId: 2475606,
        //     // 歌詞タイミング訂正履歴: https://textalive.jp/lyrics/piapro.jp%2Ft%2FQtjE%2F20220207164031
        //     lyricId: 56131,
        //     lyricDiffId: 9638
        //    },
        // });
        //
  
      } else {
        console.log("No app.managed"); 
      }

      if (!app.managed) {
      }
    },

    onAppMediaChange: (mediaUrl) => {
      console.log("新しい再生楽曲が指定されました:", mediaUrl);
    },

    onVolumeUpdate: (e)=>{
      console.log("Volume", e);
    },
  
    onFontsLoad: (e) =>{/* フォントが読み込めたら呼ばれる */
      console.log("font", e);
    },
  
    onTextLoad: (body) => {/* 楽曲のテキスト情報が取得されたら */
      console.log("onTextLoad",body);
    },
  
    onVideoReady: (video)=> {/* 楽曲情報が取れたら呼ばれる */

      if (!player.app.managed) {

        //ビート・コード進行・繰り返し区間（サビ候補）・ビート、コード進行、繰り返し区間のリビジョンID（バージョン番号）
        //セグメント_繰り返し区間（サビ候補）
        let Segments = player.data.songMap.segments;
        let NosortSegments =[];
        for(let i=0; i<Segments.length; i++){
          if(Segments[i].chorus){
              Array.from(Segments[i].segments, (z)=>{
                z.chorus = true;
                z.section = i;
                NosortSegments.push(z);
              })
          }else{
              Array.from(Segments[i].segments, (z)=>{
                z.chorus = false;
                z.section = i;
                NosortSegments.push(z);
              })
          }
        }
        //時間に降順にして配列情報を渡す オブジェクトの昇順ソート
        SEGMENTS = NosortSegments.sort(function(a, b) {return (a.startTime < b.startTime) ? -1 : 1;});
        console.log("サビの区間情報：",SEGMENTS);
        MaxVocal = player.getMaxVocalAmplitude();
        console.log("最大声量：" + MaxVocal)
        //終了処理のために取得するグローバル変数
        voiceEndTime = player.video.data.endTime;
        endTime = player.video.data.duration;
        console.log("終了時間 VoiceEndTime:" + voiceEndTime);
        console.log("終了時間 duration:" + endTime);
        console.log("FPS:" + player.fps);

        //ビートタイム
        //let BEATS = player.data.songMap.beats;
        //console.log(BEATS);

      }//END if (!player.app.managed)
  
    },
  
    onTimerReady() {/* 再生コントロールができるようになったら呼ばれる */
      //loadingのテキストの書き換え
      console.log("再生準備ができました");
      
      //再生ボタンのスイッチング
      document.getElementById("Play-Btn").addEventListener("click", () => function(p){  
        if (p.isPlaying){ 
            //再生中
        }else{
            //再生してない
            p.requestPlay();
        }
      }(player));

      //停止ボタンのスイッチング
      document.getElementById("Stop-Btn").addEventListener("click", () => function(p){ 
        if (p.isPlaying){
          //再生中なら
            p.requestStop();
        }else{ 
          //再生してない   
        }
      }(player));

    },
  
    onPlay: () => {/* 再生時に呼ばれる */
      console.log("player.onPlay");
    },
  
    onPause: () => {
      console.log("player.onPause");
      //★初期起動時にpostion値が入るバグ回避
      player.requestStop();//onStopを呼ぶ 
    },
  
    onSeek: () => {
      console.log("player.onSeek");
    },
  
    onStop: () => {
      console.log("player.onStop");
      
      //初期化
      nowChar = "";
      nowWord = "";
      nowPhrase = "";
    },

    //再生時に回転する 再生位置の情報が更新されたら呼ばれる */
    // onTimeUpdate: (position) =>{
    //   console.log(position);

    //   /* 歌詞＆フレーズ　*/
    //   let Char = player.video.findChar(position - 100, { loose: true });
    //   let Word = player.video.findWord( position - 100, { loose: true });
    //   let Phrase = player.video.findPhrase( position - 100, { loose: true });
      
    //   //文字を取得する
    //   if(nowChar != Char.text){
    //         nowChar = Char.text;
    //         console.log(nowChar);
    //   }//End if(char)

    //   //単語を取得する
    //   if(Word){
    //     if(nowWord != Word.text){
    //         nowWord = Word.text;
    //         console.log(nowWord);
    //     }
    //   }//End if(Word)
      
    //   //フレーズを取得する
    //   if(Phrase) {
    //     if(nowPhrase != Phrase.text){
    //         nowPhrase = Phrase.text
    //         console.log(nowPhrase);
    //     }
    //   }//End if(phrase)
      
    //   //ボーカルの声量を取得する
    //   SongVocal = player.getVocalAmplitude(position)/ MaxVocal;
    //   console.log(SongVocal);

    //   //声量を100%で表示する
    //   //positionbarElement.style.width = Math.floor( position ) / endTime * 100 + "%";
    // }// End onTimeUpdate
  

});//END player.addListener
  

//
// 曲を別のものに変更する
//

function valueChange(){
  // イベントが発生した時の処理
  let num = document.getElementById("select").value;
  player.createFromSongUrl( Songs[num].url, Songs[num].data,);
  //
  console.log("Select_Change");
}

// 選択式のメニューで変更があったら、新しい曲に変更される
let element = document.getElementById('select');
element.addEventListener('change', valueChange);


/////////////////////////////////////////////////////////////////////////
///// 
///// MY FUNCTION
///// 
///// 
/////////////////////////////////////////////////////////////////////////

// Random の値
function getRandomNum(min = 0, max = 0){
  return Math.floor( Math.random() * (max - min + 1)) + min;
}

/////////////////////////////////////////////////////////////////////////
///// 
///// THREE.JS
///// 
///// 
/////////////////////////////////////////////////////////////////////////

/////////////////////////////////////////////////////////////////////////
///// SCENE CREATION

const scene = new THREE.Scene()
scene.background = new THREE.Color('#eeeeee'); // 背景色
scene.fog = new THREE.Fog(0xeeeeee, 50, 500); // Fogの設定

/////////////////////////////////////////////////////////////////////////
///// RENDERER CONFIG

let PixelRation = 1; //PixelRatio
PixelRation = Math.min(window.devicePixelRatio, 2.0);

const renderer = new THREE.WebGLRenderer({
  canvas:document.getElementById("MyCanvas"),
  alpha:true,
  antialias: true,
});
renderer.autoClear = false;
renderer.setPixelRatio(PixelRation) //Set PixelRatio
renderer.setSize(window.innerWidth, window.innerHeight) // Make it FullScreen

/////////////////////////////////////////////////////////////////////////
// STATS SET

const stats = new Stats();
stats
stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild(stats.dom);
Object.assign(stats.dom.style, {'position': 'fixed','height': 'max-content',
  'left': '0','right': 'auto',
  'top': 'auto','bottom': '0'
});

/////////////////////////////////////////////////////////////////////////
///// CAMERAS CONFIG

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 1000)
camera.position.set(0.0, 0.0, 120.0);
scene.add(camera)

/////////////////////////////////////////////////////////////////////////
///// CREATE ORBIT CONTROLS

const controls = new OrbitControls(camera, renderer.domElement)

/////////////////////////////////////////////////////////////////////////
///// CREATE HELPER

const size = 200;
const divisions = 40;

const gridHelperA = new THREE.GridHelper( size, divisions, "#cccccc", "#cccccc" );
gridHelperA.position.set(0.0, 10.0, 0);
gridHelperA.rotation.x = Math.PI/2
scene.add( gridHelperA );

const axesHelper = new THREE.AxesHelper(10);
scene.add(axesHelper);

/////////////////////////////////////////////////////////////////////////
///// OBJECT DELETE

// Sceneにある指定されたidを削除する
function removeObjectsByName(SC, Name) {
  const objects = [];
  
  SC.traverse((object) => {
    if (object.name === Name) {
      objects.push(object);
    }
  });

  objects.forEach((object) => {
    SC.remove(object);
    //
    if(object.type == 'Group'){
      object.children.forEach((element) => {

        element.geometry.dispose();
        // textrueの削除
        if (element.material.map)element.material.map.dispose();

        element.material.dispose();
      });
    }else{

      object.geometry.dispose();
      // textrueの削除
      if (object.material.map)object.material.map.dispose();

      object.material.dispose();
      
    }
  });

}

/////////////////////////////////////////////////////////////////////////
///// OBJECT SET

//文字データから、大小を識別して位置とサイズを算出して、配列にデータを格納する
function calculation(PhraseData){

  const DataArray = [];
  const VN_Width = 7; // planeGeometry size
  const ETC_Width = 7; // planeGeometry size
  let posX = 0; 

  PhraseData._children.forEach((CharElement, index)=> {

    if( CharElement._data.pos == "V" || CharElement._data.pos == "N" ){
      CharElement._data.characters.forEach((CharElement, index)=> {
        DataArray.push({m:true,w:VN_Width, p:posX})
        posX += VN_Width;
      });
      
    }else{
      CharElement._data.characters.forEach((CharElement, index)=> {
        DataArray.push({m:false,w:ETC_Width, p:posX})
        posX += ETC_Width;
      }); 
    }
  });

  return DataArray;
}

class ObjectText{
  // コンストラクター
  constructor(string, PhraseData) {
    this.string = string;
    this.Data = PhraseData;

    this.material = new THREE.MeshBasicMaterial({
      color: 0x222222,
      side: THREE.DoubleSide,
      transparent: true,
      wireframe: false,
    });
  }

  //メソッド　Fillテキスト
  CreatObject(){
    const TEXT = this.string;
    const shapes = Ffont.generateShapes( TEXT, 4 );//文字サイズ
    const TextGeometry = new THREE.ShapeGeometry( shapes, 4 );
    TextGeometry.computeBoundingBox();
    TextGeometry.center();//Center the geometry based on the bounding box.

    const Geotext = new THREE.Mesh( TextGeometry, this.material );
    
    //中央に表示する
    Geotext.name = "SongText";
    scene.add(Geotext);
  }

  // メソッド
  CreateLineCharObject(){

    let charnum=0;

    //文字のそれぞれの位置を計算する
    const TextDataArray = calculation(this.Data, 7, 7);
    let totalTextMaxLength = 0;//全体の横長を計算する
    TextDataArray.forEach((CharElement, index)=> {
      totalTextMaxLength += CharElement.w;
    });
    
    //単語ごとに抽出
    [...this.Data._data.words].forEach((WordElement, index) => {

      // 文字ごとに抽出
      [...WordElement.characters].forEach((CharElement, index) => {

        //console.log(CharElement);
        const TEXT = CharElement.char;
        const shapes = Ffont.generateShapes( TEXT, 4 );//文字サイズ

        //中のラインを形成するために必要
        const holeShapes = [];
        for ( let i = 0; i < shapes.length; i ++ ) {
          const shape = shapes[ i ];
          if ( shape.holes && shape.holes.length > 0 ) {
            for ( let j = 0; j < shape.holes.length; j ++ ) {
              const hole = shape.holes[ j ];
              holeShapes.push( hole );
            }
          }
        }
        shapes.push.apply( shapes, holeShapes );

        const lineText = new THREE.Group();
        const TextMaterial = this.material

        for ( let i = 0; i < shapes.length; i ++ ) {
          const shape = shapes[ i ];
          const points = shape.getPoints();
          const geometry = new THREE.BufferGeometry().setFromPoints( points );
          const lineMesh = new THREE.Line( geometry, TextMaterial );
          // Set DrawRange
          lineMesh.geometry.setDrawRange(0,0);
          const DrawNum = lineMesh.geometry.attributes.position.count;
          // position
          const PosX = -(totalTextMaxLength)*0.5 + TextDataArray[charnum].p +  TextDataArray[charnum].w*0.5;
          lineMesh.position.set(PosX, 0, 0);

          gsap.to(lineMesh, 0.8,{
            ease: "power1.inOut",
            delay: 0.02*charnum,
            onUpdate: function(){
              lineMesh.geometry.setDrawRange(0, DrawNum*this.progress());
            },
          });

          lineText.add( lineMesh );
        }

        lineText.name = "SongText";
        scene.add( lineText );
        /////////////////////////////////////////////////////////////////

        charnum++;
      })

    }); 

  }// End CreateCharObject()

}

/////////////////////////////////////////////////////////////////////////
//// RENDER LOOP FUNCTION

const clock = new THREE.Clock();
const positionbarElement = document.getElementById("nav-bar");

function renderLoop() {
    stats.begin();//STATS計測

    //const delta = clock.getDelta();//animation programs
    //const elapsedTime = clock.getElapsedTime();

    ////////////////////////////////////////
    // TextAlive 
    if(player.isPlaying){
      const position = player.timer.position;
      
      //let Char = player.video.findChar(position - 100, { loose: true });
      //let Word = player.video.findWord( position - 100, { loose: true });
      let Phrase = player.video.findPhrase( position - 100, { loose: true });

      if(Phrase) {
        if(nowPhrase != Phrase.text){
  
            nowPhrase = Phrase.text
            //
            const StartTime = Phrase.startTime - position - 100;
            const EndTime = Phrase.endTime - position;
            //
            setTimeout(() => {
              const myObject = new ObjectText(nowPhrase, Phrase);
              myObject.CreateLineCharObject();
            }, StartTime);

            setTimeout(() => {
              removeObjectsByName(scene, "SongText");
            },EndTime);

        }
      }//End if(phrase)

      //再生バーの更新
      positionbarElement.style.width = Math.floor( position ) / endTime * 100 + "%"; 

    }
    // End TextAlive
    ////////////////////////////////////////

    renderer.render(scene, camera);

    requestAnimationFrame(renderLoop) //loop the render function
    stats.end();//stats計測
}

renderLoop() //start rendering

/////////////////////////////////////////////////////////////////////////
///// MAKE EXPERIENCE FULL SCREEN

window.addEventListener('resize', () => {
    const pixel = Math.min(window.devicePixelRatio, 2.0);
    //
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    //
    renderer.setPixelRatio(pixel) //set pixel ratio
    renderer.setSize(window.innerWidth, window.innerHeight) // make it full screen  
})

/////////////////////////////////////////////////////////////////////////
///// STATS SETTING

const params = {						  
  myVisibleBoolean1: true,
  myVisibleBoolean2: false,
  valueA: 0.5, //
  valueB: 0.5, //
};
	
gui.add( params, 'myVisibleBoolean1').name('helper').listen()
.listen().onChange( function( value ) { 
  if( value == true ){
    gridHelperA.visible = value;
    axesHelper.visible = value;
  }else{
    gridHelperA.visible = value;
    axesHelper.visible = value;
  }
});

}//End Windows.onload
