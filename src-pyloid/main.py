from pyloid import (
    TrayEvent,
)
from pyloid.utils import get_production_path, is_production, get_free_port
from pyloid.serve import pyloid_serve
from server import start_api_server
from pyloid_app import app, api_port


api_url = start_api_server(host="127.0.0.1", port=api_port)
print(f"API 서버가 {api_url}에서 실행 중입니다")


if is_production():
    app.set_icon(get_production_path("src-pyloid/icons/icon.ico"))
    app.set_tray_icon(get_production_path("src-pyloid/icons/icon.ico"))
else:
    app.set_icon("src-pyloid/icons/icon.ico")
    app.set_tray_icon("src-pyloid/icons/icon.ico")


############################## Tray ################################
def on_double_click():
    app.show_and_focus_main_window()


app.set_tray_actions(
    {
        TrayEvent.DoubleClick: on_double_click,
    }
)
app.set_tray_menu_items(
    [
        {"label": "종료하기", "callback": app.quit},
    ]
)
####################################################################

if is_production():
    url = pyloid_serve(directory=get_production_path("dist-front"))
    window = app.create_window(
        title="LMDesk",
        frame=False,
    )
    print(url)
    window.load_url(url)
else:
    window = app.create_window(
        title="LMDesk-dev",
        dev_tools=True,
        frame=False,
    )
    window.load_url("http://localhost:5173")

window.show_and_focus()

app.run()
