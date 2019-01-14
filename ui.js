(function () {
    function set_globals() {
        _w = window;
        _d = _w.document;
        el_hi = _d.getElementById("hex_input");
        el_msg = _d.getElementById("msg");
        el_hv = _d.getElementById("hex_view");
        el_bv = _d.getElementById("bin_view");
        el_av = _d.getElementById("asm_view");
    }

    function resetUI() {
        el_msg.innerHTML = "";
        el_hv.innerHTML = "";
        el_bv.innerHTML = "";
        el_av.innerHTML = "";
    }

    function reg_events() {
        el_hi.addEventListener("change", handle_hex_input_change);
    }

    function handle_hex_input_change(evt) {
        if (!(el_hi.files && el_hi.files[0])) return;
        resetUI();
        open_hex_file(el_hi.files[0]);
    }

    function open_hex_file(f) {
        let r = new FileReader();
        r.onload = evt => {
            const lines = parse_hex(r.result);
            render_hex_view(lines);

            if (lines.filter(v => v.error != null)) {
                return;
            }
        }
        r.readAsText(f);
    }

    function parse_hex(t) {
        const lines = t.split("\n").map((v, i) => {
            return parse_hex_line(v.trim(), i + 1);
        });

        for (const cur_ln of lines) {
            for (const ln of lines) {
                if (cur_ln.number !== ln.number &&
                    cur_ln.type === ln.type &&
                    cur_ln.address >= ln.address &&
                    cur_ln.address < ln.address + ln.count) {
                    cur_ln.error = "E_OVERLAP";
                }
            }
        }
        return lines;
    }

    function parse_hex_line(line_text, line_number) {
        let line_data = {
            text: line_text,
            number: line_number
        };

        if (!line_text) {
            return line_data;
        }

        if (!line_text.match(/^:([0-9a-f][0-9a-f])+$/i)) {
            line_data.error = "E_FORMAT";
            return line_data;
        }

        if (line_text.length < 11) {
            line_data.error = "E_TOOSHORT";
            return line_data;
        }

        const start_part = line_text.substring(0, 1);
        const count_part = line_text.substring(1, 3);
        const count = Number.parseInt(count_part, 16);

        if (line_text.length != count * 2 + 11) {
            line_data.error = "E_LENGTH";
            return line_data;
        }

        const address_part = line_text.substring(3, 7);
        const address = Number.parseInt(address_part, 16);

        const type_part = line_text.substring(7, 9);
        const type = Number.parseInt(type_part, 16);

        if (!(type === 0x00 || type === 0x01)) {
            line_data.error = "E_TYPENOTSUPPORT";
        }

        const data_part = line_text.substring(9, 9 + count * 2);
        const data = [];
        for (let p = 0; p < count * 2; p += 2) {
            data.push(Number.parseInt(data_part.substring(p, p + 2), 16));
        }

        const checksum_part = line_text.substring(line_text.length - 2, line_text.length);
        const checksum = Number.parseInt(checksum_part, 16);

        line_data.start_part = start_part;
        line_data.count_part = count_part;
        line_data.count = count;
        line_data.address_part = address_part;
        line_data.address = address;
        line_data.type_part = type_part;
        line_data.type = type;
        line_data.data_part = data_part;
        line_data.data = data;
        line_data.checksum_part = checksum_part;
        line_data.checksum = checksum;

        const sum = (count + (address >> 8) + (address & 0xFF) + type +
            data.reduce((a, c) => a + c, 0)) & 0xFF;

        const corrected_checksum = (~sum + 1) & 0xFF;
        if (line_data.checksum != corrected_checksum) {
            line_data.error = "E_CHECKSUM";
            line_data.corrected_checksum = corrected_checksum;
        }

        return line_data;
    }

    function render_hex_view(hex_lines) {
        let table = _d.createElement("table");
        let tbody = _d.createElement("tbody");
        const rows = hex_lines.map((v, i) => {
            let tr = _d.createElement("tr");

            let td_ln_no = _d.createElement("td");
            td_ln_no.className = "text_header";
            td_ln_no.innerText = v.number;
            tr.appendChild(td_ln_no);

            if (v.start_part && v.count_part && v.address_part && v.type_part &&
                (v.count == 0 || v.data_part) && v.checksum_part) {
                let td_start = _d.createElement("td");
                td_start.className = "hex_start";
                td_start.innerText = v.start_part;
                tr.appendChild(td_start);

                let td_cnt = _d.createElement("td");
                td_cnt.className = "hex_count";
                td_cnt.innerText = v.count_part;
                tr.appendChild(td_cnt);

                let td_addr = _d.createElement("td");
                td_addr.className = "hex_addr";
                td_addr.innerText = v.address_part;
                tr.appendChild(td_addr);

                let td_type = _d.createElement("td");
                td_type.className = "hex_type";
                td_type.innerText = v.type_part;
                tr.appendChild(td_type);

                let td_data = _d.createElement("td");
                td_data.className = "hex_data";
                td_data.innerText = v.data_part;
                tr.appendChild(td_data);

                let td_cs = _d.createElement("td");
                td_cs.className = "hex_cs";
                td_cs.innerText = v.checksum_part;
                tr.appendChild(td_cs);
            } else {
                let td_ln_txt = _d.createElement("td");
                td_ln_txt.colSpan = 6;
                tr.appendChild(td_ln_txt);
            }

            let td_err = _d.createElement("td");
            td_err.innerText = v.error || "";
            tr.appendChild(td_err);

            tbody.appendChild(tr);
        });
        table.appendChild(tbody);
        el_hv.appendChild(table);
    }

    /*= 初始化 =*/
    set_globals();
    reg_events();
})();