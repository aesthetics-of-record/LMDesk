from pyloid import Pyloid
from pyloid.utils import get_free_port
from database import db

api_port = get_free_port()

app = Pyloid(
    app_name="Pyloid-App",
    single_instance=True,
    data={"api_url": f"http://127.0.0.1:{api_port}", "db_path": str(db.db_path)},
)
