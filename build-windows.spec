# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(
    ['src-pyloid/main.py'],
    pathex=[],
    binaries=[],
    datas=[
        ['src-pyloid/icons/', 'src-pyloid/icons/'], 
        ['dist-front/', 'dist-front/'],
        ('.venv/Lib/site-packages/litellm/litellm_core_utils/tokenizers', 'litellm/litellm_core_utils/tokenizers'),
    ],
    hiddenimports=['tiktoken_ext.openai_public', 'tiktoken_ext'],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=['PySide6.QtQml', 'PySide6.QtTest', 'PySide6.Qt3D', 'PySide6.QtSensors', 'PySide6.QtCharts', 'PySide6.QtGraphs', 'PySide6.QtDataVisualization', 'PySide6.QtQuick', 'PySide6.QtDesigner', 'PySide6.QtUiTools', 'PySide6.QtHelp'],
    win_no_prefer_redirects=False,
    win_private_assemblies=False,
    cipher=block_cipher,
    noarchive=False
)

pyz = PYZ(a.pure, a.zipped_data,
          cipher=block_cipher)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.zipfiles,
    a.datas,
    [],
    name='pyloid-app',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
    icon='src-pyloid/icons/icon.ico'
)
