from fastapi import APIRouter
from pyloid_app import app

router = APIRouter(prefix="/window")


@router.get("/show/{window_id}")
async def show(window_id: str):
    window = app.get_window_by_id(window_id)
    window.show()
    window.focus()
    return {"message": "show"}


@router.get("/toggle-maximize/{window_id}")
async def toggle_maximize(window_id: str):
    window = app.get_window_by_id(window_id)
    window.toggle_maximize()
    return {"message": "toggle_maximize"}


@router.get("/hide/{window_id}")
async def hide(window_id: str):
    window = app.get_window_by_id(window_id)
    window.hide()
    return {"message": "hide"}


@router.get("/close/{window_id}")
async def close(window_id: str):
    window = app.get_window_by_id(window_id)
    window.close()
    return {"message": "close"}


@router.get("/minimize/{window_id}")
async def minimize(window_id: str):
    window = app.get_window_by_id(window_id)
    window.minimize()
    return {"message": "minimize"}


@router.get("/maximize/{window_id}")
async def maximize(window_id: str):
    window = app.get_window_by_id(window_id)
    window.maximize()
    return {"message": "maximize"}


@router.get("/unmaximize/{window_id}")
async def unmaximize(window_id: str):
    window = app.get_window_by_id(window_id)
    window.unmaximize()
    return {"message": "unmaximize"}


@router.get("/fullscreen/{window_id}")
async def fullscreen(window_id: str):
    window = app.get_window_by_id(window_id)
    window.fullscreen()
    return {"message": "fullscreen"}


@router.get("/quit")
async def quit():
    app.quit()
    return {"message": "quit"}
