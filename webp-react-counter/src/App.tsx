import { useEffect, useRef, useState } from 'react'
import './App.css'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [gameState, setGameState] = useState('START') // 'START', 'PLAYING', 'GAME_OVER', 'VICTORY'
  const [score, setScore] = useState(0) 

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 게임 설정 및 변수 초기화
    let animationFrameId: any
    
    // 공 설정
    const ball = {
      x: canvas.width / 2,
      y: canvas.height - 30,
      dx: 4,
      dy: -4,
      radius: 8,
      speed: 4
    }

    // 패들(받침대) 설정
    const paddle = {
      height: 12,
      width: 90,
      x: (canvas.width - 90) / 2,
      dx: 7
    }

    // 키보드 상태
    let rightPressed = false
    let leftPressed = false

    // 벽돌 설정 (5행 7열)
    const brickRowCount = 5
    const brickColumnCount = 7
    const brickWidth = 65
    const brickHeight = 20
    const brickPadding = 10
    const brickOffsetTop = 40
    const brickOffsetLeft = 35

    // 벽돌 배열 생성 (색상 및 점수 다채롭게 부여)
    const colors = ['#FF4D4D', '#FFA500', '#FFD700', '#4CAF50', '#2196F3']
    const bricks: { x: number; y: number; status: number; color: string }[][] = []
    for (let c = 0; c < brickColumnCount; c++) {
      bricks[c] = []
      for (let r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1, color: colors[r] }
      }
    }

    let currentScore = 0

    // 키보드 이벤트 리스너
    const keyDownHandler = (e: { key: string }) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = true
      else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = true
    }

    const keyUpHandler = (e: { key: string }) => {
      if (e.key === 'Right' || e.key === 'ArrowRight') rightPressed = false
      else if (e.key === 'Left' || e.key === 'ArrowLeft') leftPressed = false
    }

    // 마우스 이동 이벤트 리스너 (마우스로도 패들 조작 가능)
    const mouseMoveHandler = (e: { clientX: number }) => {
      const relativeX = e.clientX - canvas.getBoundingClientRect().left
      if (relativeX > 0 && relativeX < canvas.width) {
        paddle.x = relativeX - paddle.width / 2
      }
    }

    document.addEventListener('keydown', keyDownHandler)
    document.addEventListener('keyup', keyUpHandler)
    document.addEventListener('mousemove', mouseMoveHandler)

    // 충돌 감지 함수
    const collisionDetection = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          const b = bricks[c][r]
          if (b.status === 1) {
            if (
              ball.x > b.x &&
              ball.x < b.x + brickWidth &&
              ball.y > b.y &&
              ball.y < b.y + brickHeight
            ) {
              ball.dy = -ball.dy
              b.status = 0
              currentScore += 10
              setScore(currentScore)

              // 승리 조건 검사
              if (currentScore === brickRowCount * brickColumnCount * 10) {
                setGameState('VICTORY')
                return
              }
            }
          }
        }
      }
    }

    // 그리기 함수들
    const drawBall = () => {
      ctx.beginPath()
      ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#00F0FF'
      ctx.shadowBlur = 10
      ctx.shadowColor = '#00F0FF'
      ctx.fill()
      ctx.closePath()
      ctx.shadowBlur = 0 // 다른 요소에 그림자 영향 없도록 리셋
    }

    const drawPaddle = () => {
      ctx.beginPath()
      ctx.roundRect(paddle.x, canvas.height - paddle.height - 10, paddle.width, paddle.height, 5)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.closePath()
    }

    const drawBricks = () => {
      for (let c = 0; c < brickColumnCount; c++) {
        for (let r = 0; r < brickRowCount; r++) {
          if (bricks[c][r].status === 1) {
            const brickX = c * (brickWidth + brickPadding) + brickOffsetLeft
            const brickY = r * (brickHeight + brickPadding) + brickOffsetTop
            bricks[c][r].x = brickX
            bricks[c][r].y = brickY
            ctx.beginPath()
            ctx.roundRect(brickX, brickY, brickWidth, brickHeight, 4)
            ctx.fillStyle = bricks[c][r].color
            ctx.fill()
            ctx.closePath()
          }
        }
      }
    }

    // 메인 게임 루프
    const render = () => {
      if (gameState !== 'PLAYING') return

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      drawBricks()
      drawBall()
      drawPaddle()
      collisionDetection()

      // 좌우 벽 충돌
      if (ball.x + ball.dx > canvas.width - ball.radius || ball.x + ball.dx < ball.radius) {
        ball.dx = -ball.dx
      }

      // 위쪽 벽 충돌
      if (ball.y + ball.dy < ball.radius) {
        ball.dy = -ball.dy
      } else if (ball.y + ball.dy > canvas.height - ball.radius - 10) {
        // 패들 충돌 검사
        if (ball.x > paddle.x && ball.x < paddle.x + paddle.width) {
          // 공이 패들의 어느 부분에 맞았는지에 따라 튕기는 각도 변경
          const hitPoint = (ball.x - (paddle.x + paddle.width / 2)) / (paddle.width / 2)
          ball.dx = hitPoint * 5
          ball.dy = -Math.abs(ball.dy)
        } else if (ball.y + ball.dy > canvas.height - ball.radius) {
          // 바닥에 떨어짐 (게임 오버)
          setGameState('GAME_OVER')
          return
        }
      }

      // 패들 이동
      if (rightPressed && paddle.x < canvas.width - paddle.width) {
        paddle.x += paddle.dx
      } else if (leftPressed && paddle.x > 0) {
        paddle.x -= paddle.dx
      }

      ball.x += ball.dx
      ball.y += ball.dy

      animationFrameId = requestAnimationFrame(render)
    }

    if (gameState === 'PLAYING') {
      render()
    }

    // 정리(Cleanup)
    return () => {
      cancelAnimationFrame(animationFrameId)
      document.removeEventListener('keydown', keyDownHandler)
      document.removeEventListener('keyup', keyUpHandler)
      document.removeEventListener('mousemove', mouseMoveHandler)
    }
  }, [gameState])

  const startGame = () => {
    setScore(0)
    setGameState('PLAYING')
  }

  return (
    <div className="game-container">
      <h1 className="game-title">🧱 벽돌 깨기</h1>
      <div className="score-board">점수: {score}</div>
      
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={560} height={400} />

        {gameState !== 'PLAYING' && (
          <div className="overlay">
            {gameState === 'START' && <h2>벽돌 깨기 게임</h2>}
            {gameState === 'GAME_OVER' && <h2 className="over">GAME OVER</h2>}
            {gameState === 'VICTORY' && <h2 className="win">VICTORY! 🎉</h2>}
            
            <p>방향키(←, →) 또는 마우스로 조작하세요.</p>
            <button className="start-btn" onClick={startGame}>
              {gameState === 'START' ? '게임 시작' : '다시 시작'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default App