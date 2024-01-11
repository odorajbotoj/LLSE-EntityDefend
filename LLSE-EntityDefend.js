ll.registerPlugin("LLSE-EntityDefend", "EntityDefend", [0, 0, 1, Version.Release], {
    "Author": "odorajbotoj"
});

const DATAPATH = ".\\plugins\\LLSE-EntityDefendData\\";

// 创建文件夹与文件
if (!(File.exists(DATAPATH) && File.checkIsDir(DATAPATH))) {
    File.mkdir(DATAPATH);
}
if (!(File.exists(DATAPATH+"data.json") && !File.checkIsDir(DATAPATH+"data.json"))) {
    File.writeTo(DATAPATH+"data.json", "[]");
}
var edJson = File.readFrom(DATAPATH + "data.json");
var edArr = data.parseJson(edJson);

function inArea(pos, from, to) {
    // 判断点位在某一区域内
    if (from.x >= to.x) {
        if (pos.x < to.x || pos.x > from.x) {
            return false;
        }
    } else {
        if (pos.x < from.x || pos.x > to.x) {
            return false;
        }
    }
    if (from.y >= to.y) {
        if (pos.y < to.y || pos.y > from.y) {
            return false;
        }
    } else {
        if (pos.y < from.y || pos.y > to.y) {
            return false;
        }
    }
    if (from.z >= to.z) {
        if (pos.z < to.z || pos.z > from.z) {
            return false;
        }
    } else {
        if (pos.z < from.z || pos.z > to.z) {
            return false;
        }
    }
    return true;
}

function down() {
    // 数据落地
    var tex = data.toJson(edArr, 4);
    if (tex == null || tex == "") {
        return false;
    }
    return File.writeTo(DATAPATH + "data.json", tex);
}

mc.listen("onServerStarted", () => {
    // 注册指令
    const cmd = mc.newCommand("ende", "Entity Defend");

    // ende add <from> <to> <name>
    cmd.setEnum("AddAction", ["add"]);
    cmd.mandatory("action", ParamType.Enum, "AddAction", "AddAction", 1);
    cmd.mandatory("from", ParamType.BlockPos);
    cmd.mandatory("to", ParamType.BlockPos);
    cmd.mandatory("name", ParamType.String);
    cmd.overload(["AddAction", "from", "to", "name"]);

    // ende rm <name>
    cmd.setEnum("RmAction", ["rm"]);
    cmd.mandatory("action", ParamType.Enum, "RmAction", "RmAction", 1);
    cmd.overload(["RmAction", "name"]);

    // ende ls
    cmd.setEnum("LsAction", ["ls"]);
    cmd.mandatory("action", ParamType.Enum, "LsAction", "LsAction", 1);
    cmd.overload(["LsAction"]);

    // ende wl <name> <add|rm> <player>
    cmd.setEnum("WLAction", ["wl"]);
    cmd.mandatory("action", ParamType.Enum, "WLAction", "WLAction", 1);
    cmd.setEnum("AType", ["add", "rm"]);
    cmd.mandatory("atype", ParamType.Enum, "AType", "AType", 1);
    cmd.mandatory("player", ParamType.String);
    cmd.overload(["WLAction", "name", "AType", "player"]);

    // ende en <name> <add|rm> <type>
    cmd.setEnum("ENAction", ["en"]);
    cmd.mandatory("action", ParamType.Enum, "ENAction", "ENAction", 1);
    cmd.mandatory("type", ParamType.ActorType);
    cmd.overload(["ENAction", "name", "AType", "type"]);

    cmd.setCallback((_cmd, ori, out, res) => {
        //
        if (ori.player == null) {
            out.error("[EntityDefend] 仅OP玩家可执行");
            return;
        }
        switch (res.action) {
            case "add":
                // 添加
                for (var i = 0; i < edArr.length; i++) {
                    if (edArr[i].name == res.name) {
                        out.error("[EntityDefend] 已存在同名区域");
                        return;
                    }
                }
                edArr.push({
                    name: res.name,
                    dimid: ori.player.pos.dimid,
                    from: {
                        x: res.from.x,
                        y: res.from.y,
                        z: res.from.z
                    },
                    to: {
                        x: res.to.x,
                        y: res.to.y,
                        z: res.to.z
                    },
                    whitelist: [],
                    entity: []
                });
                if (!down()) {
                    out.error("[EntityDefend] 错误：无法保存");
                    return;
                }
                out.success("操作成功");
                break;

            case "rm":
                // 删除
                for (var i = 0; i < edArr.length; i++) {
                    if (edArr[i].name == res.name) {
                        edArr.splice(i, 1);
                        if (!down()) {
                            out.error("[EntityDefend] 错误：无法保存");
                            return;
                        }
                        out.success("操作成功");
                        return;
                    }
                }
                out.error("[EntityDefend] 找不到该名称对应的区域");
                break;

            case "ls":
                // 列出所有
                var sArr = new Array();
                for (var i = 0; i < edArr.length; i++) {
                    sArr.push(`名称：${edArr[i].name}`);
                    sArr.push(`维度ID：${edArr[i].dimid}`);
                    sArr.push(`起始点：X:${edArr[i].from.x} Y:${edArr[i].from.y} Z:${edArr[i].from.z}`);
                    sArr.push(`终到点：X:${edArr[i].to.x} Y:${edArr[i].to.y} Z:${edArr[i].to.z}`);
                    sArr.push(`白名单：${edArr[i].whitelist.join("，")}`);
                    sArr.push(`保护列表：${edArr[i].entity.join("，")}`);
                    sArr.push("");
                }
                var fm = mc.newSimpleForm().setTitle(`EntityDefend List`).setContent(sArr.join("\n"));
                ori.player.sendForm(fm, (_pl, _id) => {return});
                break;

            case "wl":
                // 白名单
                for (var i = 0; i < edArr.length; i++) {
                    if (edArr[i].name == res.name) {
                        if (res.atype == "add") {
                            // 增加
                            if (edArr[i].whitelist.includes(res.player)) {
                                out.error("[EntityDefend] 该玩家已在白名单中");
                                return;
                            }
                            edArr[i].whitelist.push(res.player);
                        } else {
                            // 删除
                            if (!edArr[i].whitelist.includes(res.player)) {
                                out.error("[EntityDefend] 该玩家不在白名单中");
                                return;
                            }
                            edArr[i].whitelist.splice(edArr[i].whitelist.indexOf(res.name), 1);
                        }
                        if (!down()) {
                            out.error("[EntityDefend] 错误：无法保存");
                            return;
                        }
                        out.success("操作成功");
                        return;
                    }
                }
                out.error("[EntityDefend] 找不到该名称对应的区域");
                break;

            case "en":
                // 实体列表
                for (var i = 0; i < edArr.length; i++) {
                    if (edArr[i].name == res.name) {
                        if (res.atype == "add") {
                            // 增加
                            if (edArr[i].entity.includes(res.type)) {
                                out.error("[EntityDefend] 该类型实体已在名单中");
                                return;
                            }
                            edArr[i].entity.push(res.type);
                        } else {
                            // 删除
                            if (!edArr[i].entity.includes(res.type)) {
                                out.error("[EntityDefend] 该类型实体不在名单中");
                                return;
                            }
                            edArr[i].entity.splice(edArr[i].entity.indexOf(res.name), 1);
                        }
                        if (!down()) {
                            out.error("[EntityDefend] 错误：无法保存");
                            return;
                        }
                        out.success("操作成功");
                        return;
                    }
                }
                out.error("[EntityDefend] 找不到该名称对应的区域");
                break;

            default:
                out.error("[EntityDefend] 未知的操作");
        }
    });

    cmd.setup();
});

mc.listen("onAttackEntity", (pl, en, _d) => {
    // 循环遍历区域
    for (var i = 0; i < edArr.length; i++) {
        // 维度不同则返回
        if (edArr[i].dimid != pl.pos.dimid) {
            continue;
        }
        // 实体不在保护名单则返回
        if (!edArr[i].entity.includes(en.type)) {
            continue;
        }
        // 玩家在白名单则返回
        if (edArr[i].whitelist.includes(pl.name)) {
            continue;
        }
        // 玩家不在区域则返回
        if (!inArea(en.pos, edArr[i].from, edArr[i].to)) {
            continue;
        } else {
            pl.tell(`${Format.Red}[EntityDefend] ${en.type}类型目标位于${edArr[i].name}区域中，不可被攻击。${Format.Clear}`);
            return false;
        }
    }
    return true;
})