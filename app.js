const {
  useState,
  useMemo,
  useEffect
} = React;

/* ------------------------------------------------------------------ */
/*  파이널 컷 · 7주 데일리 체크 캘린더                                  */
/*  9/15 → 10/31 · 주차 규칙은 최종 플랜 그대로(verbatim)              */
/* ------------------------------------------------------------------ */

// 오늘 날짜(로컬 기준)를 YYYY-MM-DD 로. 캘린더 범위 밖이면 하이라이트는 안 뜨지만 앱은 정상 동작.
const _now = new Date();
const TODAY = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, "0")}-${String(_now.getDate()).padStart(2, "0")}`;

// 체중 게이지 (시작 56kg → 목표 48kg, −8kg)
const START_W = 56;
const GOAL_W = 48;
const WEEK_DEFS = [{
  n: "1주차",
  theme: "붓기·당 컷",
  kg: "−2~3kg",
  range: "9.15 – 9.21",
  start: [2026, 9, 15],
  end: [2026, 9, 21],
  rule: "붓기·당 컷. 12시 첫 식사, 8시 식사 종료. 설탕·디저트·달달한 음료 0. 점심 밥 100g, 저녁 밥 80g. 국·찌개는 건더기 위주. 먹다가 “어? 배부른데?”라는 생각이 처음 들면 바로 수저 내려놓기. 헬스장 경사 러닝머신 30분 × 3회 + 근력 3회."
}, {
  n: "2주차",
  theme: "밀가루·간식 컷",
  kg: "−1~2kg",
  range: "9.22 – 9.28",
  start: [2026, 9, 22],
  end: [2026, 9, 28],
  rule: "밀가루·간식 컷. 빵·라면·파스타·과자·떡·케이크 7일 0. 식사는 딱 12시, 7시 두 번. 점심 밥 100g, 저녁 50g. 단백질은 줄이지 않는다. 배고프지도 않은데 뭔가 찾는 순간 물이나 제로음료 마시고 끝. 헬스장 러닝머신 인터벌 30분 × 3회 + 근력 3회."
}, {
  n: "3주차",
  theme: "저녁 무탄수",
  kg: "−1~2kg",
  range: "9.29 – 10.5",
  start: [2026, 9, 29],
  end: [2026, 10, 5],
  rule: "저녁 무탄수. 점심에는 밥 100g 먹는다. 저녁에는 밥·면·빵·떡·감자·고구마 없음. 저녁은 고기·생선·계란·두부·그릭요거트 + 채소. 첫 5입은 단백질부터. 배부름이 70~80%쯤 왔다 싶으면 식사 종료. 헬스장 천국의 계단 25~30분 × 3회 + 근력 3회."
}, {
  n: "4주차",
  theme: "단쉐 주간",
  kg: "−1~2kg",
  range: "10.6 – 10.12",
  start: [2026, 10, 6],
  end: [2026, 10, 12],
  rule: "단쉐 주간. 운동 안 하는 날 저녁 3회는 단백질쉐이크로 교체. 단쉐는 단백질 25~30g 확보하고, 너무 허기지면 삶은 계란이나 무가당 그릭요거트 추가. 운동하는 날은 저녁 정상 단백질식 + 밥 50~80g. 설탕·밀가루 금지는 계속. 근력 4회, 끝나고 경사 걷기 20분."
}, {
  n: "5주차",
  theme: "정체기 깨는 7일",
  kg: "−2kg 재도전",
  range: "10.13 – 10.19",
  start: [2026, 10, 13],
  end: [2026, 10, 19],
  rule: "정체기 깨는 7일. 이번 주는 간식·디저트·밀가루·술 전부 0. 점심 밥 80~100g, 저녁은 무탄수. 외식해도 메인 먹었으면 끝. 후식 먹으러 2차 안 간다. 헬스장 가는 날은 무조건 유산소 30분: 경사 걷기 2회 + 인터벌 2회 + 천국의 계단 1회. 근력 3~4회."
}, {
  n: "6주차",
  theme: "탄수 마지막 정리",
  kg: "−1~2kg",
  range: "10.20 – 10.26",
  start: [2026, 10, 20],
  end: [2026, 10, 26],
  rule: "탄수 마지막 정리. 운동한 날은 점심 밥 100g, 저녁 50g. 운동 안 한 날은 점심 80g, 저녁 무탄수. 단백질은 그대로. 밤에 먹고 싶으면 “지금 삶은 계란도 먹고 싶은가?” 확인. YES면 진짜 허기라 단백질 조금, NO면 주방 닫기. 근력 4회 + 유산소 30분 × 4회."
}, {
  n: "7주차",
  theme: "예외 0 파이널",
  kg: "−1~2kg",
  range: "10.27 – 10.31",
  start: [2026, 10, 27],
  end: [2026, 10, 31],
  rule: "예외 0. 12시 첫 식사, 8시 종료. 점심 밥 80~100g + 단백질, 저녁은 무탄수 단백질식 또는 단쉐식. 설탕 0, 밀가루 0, 간식 0, 술 0, 야식 0. “배부르다” 생각이 드는 순간 한입 더 먹지 않는다. 5일 중 유산소 30분 4회 + 근력 3회."
}];
const C = {
  bg: "#FBFAF7",
  card: "#FFFFFF",
  ink: "#232120",
  muted: "#6E6A62",
  faint: "#A7A198",
  line: "#ECE8E0",
  ruleBg: "#F6F4EF",
  accent: "#E35B3E",
  accentDeep: "#B23A22",
  accentTint: "#F8DED4",
  gray: "#9A948B",
  grayTint: "#EFEDE7"
};
const pad = x => String(x).padStart(2, "0");
const keyOf = (y, m, d) => `${y}-${pad(m)}-${pad(d)}`;
function daysBetween([y1, m1, d1], [y2, m2, d2]) {
  const a = new Date(y1, m1 - 1, d1),
    b = new Date(y2, m2 - 1, d2);
  const out = [];
  for (let t = a; t <= b; t.setDate(t.getDate() + 1)) {
    out.push({
      key: keyOf(t.getFullYear(), t.getMonth() + 1, t.getDate()),
      dom: t.getDate()
    });
  }
  return out;
}
const WEEKS = WEEK_DEFS.map(w => ({
  ...w,
  cells: daysBetween(w.start, w.end)
}));
const ALL_KEYS = WEEKS.flatMap(w => w.cells.map(c => c.key));
const TOTAL = ALL_KEYS.length;
const ORDER = ["success", "partial", "fail"];
const nextStatus = c => !c ? "success" : ORDER.indexOf(c) === 2 ? undefined : ORDER[ORDER.indexOf(c) + 1];

// ---- 로컬 저장 (브라우저에 기록이 남아 매일 이어서 쓸 수 있음) ----
const LS_KEY = "final-cut/v1";
function loadState() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        data: s.data || {},
        curW: typeof s.curW === "number" ? s.curW : START_W
      };
    }
  } catch (e) {}
  return {
    data: {
      "2026-09-15": "success"
    },
    curW: 55.6
  };
}
function App() {
  const _init = loadState();
  const [data, setData] = useState(_init.data);
  const [curW, setCurW] = useState(_init.curW);
  const [pop, setPop] = useState(null);
  const [menu, setMenu] = useState(false);
  const [confirm, setConfirm] = useState(false);
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        data,
        curW
      }));
    } catch (e) {}
  }, [data, curW]);
  const done = useMemo(() => Object.values(data).filter(v => v === "success").length, [data]);
  const streak = useMemo(() => {
    const ti = ALL_KEYS.indexOf(TODAY);
    let s = ti >= 0 ? ti : ALL_KEYS.length - 1;
    if (data[ALL_KEYS[s]] !== "success") s -= 1;
    let n = 0;
    for (let i = s; i >= 0; i--) {
      if (data[ALL_KEYS[i]] === "success") n++;else break;
    }
    return n;
  }, [data]);
  const pct = Math.round(done / TOTAL * 100);
  function tap(key) {
    setData(p => {
      const nx = {
        ...p
      };
      const ns = nextStatus(p[key]);
      if (ns) nx[key] = ns;else delete nx[key];
      return nx;
    });
    setPop(key);
    setTimeout(() => setPop(k => k === key ? null : k), 260);
  }
  const reset = () => {
    setData({});
    setCurW(START_W);
    setConfirm(false);
    setMenu(false);
  };
  return /*#__PURE__*/React.createElement("div", {
    className: "min-h-screen w-full flex justify-center",
    style: {
      background: C.bg,
      fontFamily: FONT
    }
  }, /*#__PURE__*/React.createElement("style", null, CSS), /*#__PURE__*/React.createElement("div", {
    className: "print-wrap w-full",
    style: {
      maxWidth: 440,
      padding: "22px 18px 44px"
    }
  }, /*#__PURE__*/React.createElement("header", {
    className: "flex items-start justify-between"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h1", {
    style: {
      fontSize: 23,
      fontWeight: 800,
      letterSpacing: "-0.02em",
      color: C.ink,
      margin: 0
    }
  }, "\uD30C\uC774\uB110 \uCEF7"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.muted,
      marginTop: 4
    }
  }, "9.15 \u2013 10.31 \xB7 \uBAA9\uD45C \u22128kg")), /*#__PURE__*/React.createElement("div", {
    className: "no-print flex items-center",
    style: {
      gap: 2
    }
  }, /*#__PURE__*/React.createElement(IconBtn, {
    onClick: () => window.print()
  }, "\uD83D\uDDA8\uFE0F"), /*#__PURE__*/React.createElement("div", {
    className: "relative"
  }, /*#__PURE__*/React.createElement(IconBtn, {
    onClick: () => setMenu(m => !m)
  }, "\u22EF"), menu && /*#__PURE__*/React.createElement("div", {
    className: "menu-pop"
  }, /*#__PURE__*/React.createElement("button", {
    className: "menu-item",
    onClick: () => {
      setMenu(false);
      window.print();
    }
  }, "\uC778\uC1C4"), /*#__PURE__*/React.createElement("div", {
    style: {
      height: 1,
      background: C.line
    }
  }), /*#__PURE__*/React.createElement("button", {
    className: "menu-item",
    style: {
      color: C.accent
    },
    onClick: () => {
      setMenu(false);
      setConfirm(true);
    }
  }, "\uC804\uCCB4 \uCD08\uAE30\uD654"))))), (() => {
    const lost = START_W - curW;
    const prog = Math.max(0, Math.min(1, lost / (START_W - GOAL_W))) * 100;
    const step = d => setCurW(w => Math.min(90, Math.max(40, Math.round((w + d) * 10) / 10)));
    const Step = ({
      d,
      children
    }) => /*#__PURE__*/React.createElement("button", {
      onClick: () => step(d),
      className: "no-print",
      style: {
        width: 30,
        height: 30,
        borderRadius: 999,
        border: `1px solid ${C.line}`,
        background: "#fff",
        color: C.muted,
        fontSize: 17,
        lineHeight: 1,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }
    }, children);
    return /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 16,
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 14,
        padding: "13px 15px"
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between"
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: C.muted
      }
    }, "\uC624\uB298 \uCCB4\uC911"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 12,
        color: C.faint
      }
    }, "\uBAA9\uD45C ", GOAL_W, "kg \xB7 \u22128kg")), /*#__PURE__*/React.createElement("div", {
      className: "flex items-center justify-between",
      style: {
        marginTop: 6
      }
    }, /*#__PURE__*/React.createElement("div", {
      className: "flex items-center",
      style: {
        gap: 10
      }
    }, /*#__PURE__*/React.createElement(Step, {
      d: -0.1
    }, "\u2212"), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 26,
        fontWeight: 800,
        color: C.ink,
        letterSpacing: "-0.01em"
      }
    }, curW.toFixed(1), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 14,
        fontWeight: 700,
        color: C.faint
      }
    }, " kg")), /*#__PURE__*/React.createElement(Step, {
      d: 0.1
    }, "+")), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 15,
        fontWeight: 800,
        color: lost > 0 ? C.accent : C.faint
      }
    }, lost > 0 ? `−${lost.toFixed(1)}kg` : "0.0kg")), /*#__PURE__*/React.createElement("div", {
      style: {
        marginTop: 11,
        height: 8,
        borderRadius: 999,
        background: "#EDE9E1",
        overflow: "hidden"
      }
    }, /*#__PURE__*/React.createElement("div", {
      style: {
        height: "100%",
        width: `${prog}%`,
        borderRadius: 999,
        background: C.accent,
        transition: "width .3s ease"
      }
    })), /*#__PURE__*/React.createElement("div", {
      className: "flex justify-between",
      style: {
        marginTop: 5
      }
    }, /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: C.faint
      }
    }, "\uC2DC\uC791 ", START_W), /*#__PURE__*/React.createElement("span", {
      style: {
        fontSize: 11,
        color: C.faint
      }
    }, "\uBAA9\uD45C ", GOAL_W)));
  })(), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center justify-between",
    style: {
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 21,
      fontWeight: 800,
      color: C.ink
    }
  }, done), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 14,
      fontWeight: 600,
      color: C.faint
    }
  }, " / ", TOTAL, "\uC77C")), streak > 0 && /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 14,
      fontWeight: 700,
      color: C.accent
    }
  }, "\uD83D\uDD25 ", streak, "\uC77C \uC5F0\uC18D")), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 8,
      height: 6,
      borderRadius: 999,
      background: "#EDE9E1",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      height: "100%",
      width: `${pct}%`,
      borderRadius: 999,
      background: C.accent,
      transition: "width .3s ease"
    }
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center",
    style: {
      gap: 16,
      marginTop: 14
    }
  }, /*#__PURE__*/React.createElement(Legend, {
    kind: "success",
    label: "\uC9C0\uD0B4"
  }), /*#__PURE__*/React.createElement(Legend, {
    kind: "partial",
    label: "\uC560\uB9E4"
  }), /*#__PURE__*/React.createElement(Legend, {
    kind: "fail",
    label: "\uBABB \uC9C0\uD0B4"
  })), /*#__PURE__*/React.createElement("div", {
    className: "flex flex-col",
    style: {
      gap: 22,
      marginTop: 22
    }
  }, WEEKS.map((w, wi) => /*#__PURE__*/React.createElement("section", {
    key: wi,
    className: "week",
    style: {
      breakInside: "avoid"
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-baseline justify-between",
    style: {
      marginBottom: 10
    }
  }, /*#__PURE__*/React.createElement("div", {
    className: "flex items-baseline",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: C.faint
    }
  }, w.n), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 16,
      fontWeight: 800,
      color: C.ink
    }
  }, w.theme)), /*#__PURE__*/React.createElement("div", {
    className: "flex items-center",
    style: {
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      color: C.faint
    }
  }, w.range), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12,
      fontWeight: 700,
      color: C.accentDeep,
      background: C.accentTint,
      borderRadius: 6,
      padding: "2px 8px"
    }
  }, w.kg))), /*#__PURE__*/React.createElement("div", {
    className: "grid grid-cols-7",
    style: {
      gap: 6
    }
  }, w.cells.map(c => /*#__PURE__*/React.createElement(Cell, {
    key: c.key,
    cell: c,
    status: data[c.key],
    today: c.key === TODAY,
    popping: pop === c.key,
    onTap: () => tap(c.key)
  })), Array.from({
    length: 7 - w.cells.length
  }).map((_, i) => /*#__PURE__*/React.createElement("div", {
    key: "e" + i,
    style: {
      aspectRatio: "1 / 1"
    }
  }))), /*#__PURE__*/React.createElement("p", {
    style: {
      fontSize: 13,
      lineHeight: 1.65,
      color: C.muted,
      background: C.ruleBg,
      borderRadius: 10,
      padding: "11px 13px",
      margin: "10px 0 0"
    }
  }, w.rule))))), confirm && /*#__PURE__*/React.createElement("div", {
    className: "no-print overlay",
    onClick: () => setConfirm(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "dialog",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 16,
      fontWeight: 700,
      color: C.ink
    }
  }, "\uBAA8\uB4E0 \uCCB4\uD06C\uB97C \uC9C0\uC6B8\uAE4C\uC694?"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: 13,
      color: C.muted,
      marginTop: 7,
      lineHeight: 1.5
    }
  }, "\uB418\uB3CC\uB9B4 \uC218 \uC5C6\uC5B4\uC694."), /*#__PURE__*/React.createElement("div", {
    className: "flex",
    style: {
      gap: 8,
      marginTop: 18
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "btn-ghost",
    onClick: () => setConfirm(false)
  }, "\uCDE8\uC18C"), /*#__PURE__*/React.createElement("button", {
    className: "btn-danger",
    onClick: reset
  }, "\uCD08\uAE30\uD654")))));
}
function Cell({
  cell,
  status,
  today,
  popping,
  onTap
}) {
  let bg = C.card,
    bd = `1px solid ${C.line}`,
    num = C.ink,
    glyph = null;
  if (status === "success") {
    bg = C.accent;
    bd = "1px solid transparent";
    num = "rgba(255,255,255,0.9)";
    glyph = /*#__PURE__*/React.createElement("span", {
      style: {
        color: "#fff",
        fontSize: 15,
        fontWeight: 800
      }
    }, "\u2713");
  } else if (status === "partial") {
    bg = C.accentTint;
    bd = "1px solid transparent";
    num = C.accentDeep;
    glyph = /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.accentDeep,
        fontSize: 15,
        fontWeight: 700
      }
    }, "\u25B3");
  } else if (status === "fail") {
    bg = C.grayTint;
    bd = "1px solid transparent";
    num = C.gray;
    glyph = /*#__PURE__*/React.createElement("span", {
      style: {
        color: C.gray,
        fontSize: 15
      }
    }, "\u2715");
  }
  return /*#__PURE__*/React.createElement("button", {
    onClick: onTap,
    className: "cell relative" + (popping ? " pop" : ""),
    style: {
      aspectRatio: "1 / 1",
      borderRadius: 10,
      background: bg,
      border: today ? `2px solid ${C.accent}` : bd,
      cursor: "pointer",
      WebkitTapHighlightColor: "transparent",
      transition: "background .15s ease"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      top: 4,
      left: 6,
      fontSize: 11,
      fontWeight: 700,
      color: num,
      lineHeight: 1
    }
  }, cell.dom), /*#__PURE__*/React.createElement("span", {
    className: "absolute inset-0 flex items-center justify-center",
    style: {
      pointerEvents: "none",
      paddingTop: 6
    }
  }, glyph));
}
function Legend({
  kind,
  label
}) {
  const box = {
    width: 16,
    height: 16,
    borderRadius: 5,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 10,
    fontWeight: 800
  };
  let el;
  if (kind === "success") el = /*#__PURE__*/React.createElement("span", {
    style: {
      ...box,
      background: C.accent,
      color: "#fff"
    }
  }, "\u2713");else if (kind === "partial") el = /*#__PURE__*/React.createElement("span", {
    style: {
      ...box,
      background: C.accentTint,
      color: C.accentDeep
    }
  }, "\u25B3");else el = /*#__PURE__*/React.createElement("span", {
    style: {
      ...box,
      background: C.grayTint,
      color: C.gray
    }
  }, "\u2715");
  return /*#__PURE__*/React.createElement("span", {
    className: "flex items-center",
    style: {
      gap: 6
    }
  }, el, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: 12.5,
      color: C.muted
    }
  }, label));
}
function IconBtn({
  children,
  onClick
}) {
  return /*#__PURE__*/React.createElement("button", {
    onClick: onClick,
    style: {
      width: 34,
      height: 34,
      borderRadius: 9,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontSize: 16,
      background: "transparent",
      border: "none",
      cursor: "pointer",
      color: C.muted
    },
    onMouseEnter: e => e.currentTarget.style.background = "#F0EDE6",
    onMouseLeave: e => e.currentTarget.style.background = "transparent"
  }, children);
}
const FONT = '-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Malgun Gothic", "Segoe UI", Roboto, sans-serif';
const CSS = `
  * { box-sizing: border-box; -webkit-font-smoothing: antialiased; }
  body { margin: 0; }
  @keyframes pop { 0%{transform:scale(.9)} 50%{transform:scale(1.06)} 100%{transform:scale(1)} }
  .cell.pop { animation: pop .26s ease-out; }
  .menu-pop { position:absolute; top:38px; right:0; z-index:20; background:#fff; border:1px solid ${C.line}; border-radius:12px; box-shadow:0 8px 26px rgba(60,50,30,0.14); overflow:hidden; width:126px; }
  .menu-item { width:100%; text-align:left; padding:11px 14px; font-size:14px; font-weight:600; color:${C.ink}; background:#fff; border:none; cursor:pointer; }
  .menu-item:hover { background:#F7F4EE; }
  .overlay { position:fixed; inset:0; z-index:50; display:flex; align-items:center; justify-content:center; padding:24px; background:rgba(40,34,24,0.3); backdrop-filter:blur(2px); }
  .dialog { width:100%; max-width:300px; background:#fff; border-radius:18px; padding:20px; box-shadow:0 20px 48px rgba(60,45,25,0.22); }
  .btn-ghost { flex:1; padding:11px; border-radius:11px; font-size:14px; font-weight:700; color:${C.muted}; background:#F2EFE8; border:none; cursor:pointer; }
  .btn-danger { flex:1; padding:11px; border-radius:11px; font-size:14px; font-weight:700; color:#fff; background:${C.accent}; border:none; cursor:pointer; }
  @media print {
    @page { size: A4 portrait; margin: 12mm; }
    body { background:#fff !important; }
    .no-print { display:none !important; }
    .print-wrap { max-width:100% !important; padding:0 !important; }
    .week { break-inside: avoid; }
    * { -webkit-print-color-adjust:exact !important; print-color-adjust:exact !important; }
  }
`;
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(React.createElement(App));
