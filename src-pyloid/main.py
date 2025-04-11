from pyloid import (
    Pyloid,
    TrayEvent,
)
from pyloid.utils import (
    get_production_path,
    is_production,
    get_free_port
)
from pyloid.serve import pyloid_serve
from server import start_api_server

api_port = get_free_port()

app = Pyloid(app_name="Pyloid-App", single_instance=True, data={"api_url": f"http://127.0.0.1:{api_port}"})

api_url = start_api_server(host="127.0.0.1", port=api_port)
print(f"API 서버가 {api_url}에서 실행 중입니다")


if is_production():
    app.set_icon(get_production_path("src-pyloid/icons/icon.png"))
    app.set_tray_icon(get_production_path("src-pyloid/icons/icon.png"))
else:
    app.set_icon("src-pyloid/icons/icon.png")
    app.set_tray_icon("src-pyloid/icons/icon.png")


############################## Tray ################################
def on_double_click():
    print("Tray icon was double-clicked.")


app.set_tray_actions(
    {
        TrayEvent.DoubleClick: on_double_click,
    }
)
app.set_tray_menu_items(
    [
        {"label": "Show Window", "callback": app.show_and_focus_main_window},
        {"label": "Exit", "callback": app.quit},
    ]
)
####################################################################

if is_production():
    url = pyloid_serve(directory="dist-front")
    window = app.create_window(
        title="Pyloid Browser-production",
    )
    window.load_url(url)
else:
    window = app.create_window(
        title="Pyloid Browser-dev",
        dev_tools=True,
    )
    window.load_url("http://localhost:5173")

window.show_and_focus()

app.run()
