import {meta_cbeta, walkDOMOfftext,DOMFromString,xpath,
    filesFromPattern, nodefs, writeChanged, 
    readTextContent,
    fromObj,
    sortObj} from "ptk/nodebundle.cjs";
await nodefs;
const rootdir='T/T54/';
const files=filesFromPattern("T54n2128*",'T/T54');

const onText=(t,ctx,started)=>{
    if (!started) return '';
    return ctx.hide>0?'':t.trim();
}
const ctx={onText,out:'',hide:0};

const onOpen={
    milestone:(el,ctx)=>{ctx.started=true;},
    'pb':(el,ctx)=>{
        ctx.vol=el.attrs['xml:id'].substr(1,2);
    },
    'head':(el,ctx)=>{
        ctx.hide++;
    },
    'p':(el,ctx)=>{
        if (el.attrs["cb:place"]=="inline") return '§';
        else return '\n';
    },
    'cb:div':(el,ctx)=>{
        return '\n';
    },
    'cb:mulu':(el,ctx)=>{
        if (el.attrs.level=="1") {
            return '^《'
        }        
    },
    'cb:jhead':(el,ctx)=>{
        ctx.hide++;
    },
    'note':(el,ctx)=>{
        if (el.attrs.place=='inline'){ //nullify 捕捉不到的note ，含有app, note
            return '〔'
        }
    }

}
const onClose={
    'note':(el,ctx)=>{
        if (el.attrs.place=='inline'){ //nullify 捕捉不到的note ，含有app, note
            return '〕'
        }
    },
    'head':(el,ctx)=>{
        ctx.hide--;
    },    
    'cb:jhead':(el,ctx)=>{
        ctx.hide--;
    },
    'cb:mulu':(el,ctx)=>{
        if (el.attrs.level=="1") {
            return '》'
        }        
    },
    'lb':(el,ctx)=>{
        // const lb=ctx.lb;
        //const lb=ctx.vol+'p'+el.attrs.n;
        //if (lb&&lb.trim()) return '\n'+lb+'|';
    },
};
const lines=[];
files.forEach(file=>{
    process.stdout.write('\r'+file+'   ');
    let buf=readTextContent(rootdir+file,'utf8');
    //deal with cross line note
    buf=buf.replace(/\n<lb[^>]+>/g,'')

    
    //buf=buf.replace(/<\/note>/g,'〕')
    let content=meta_cbeta.nullify(buf)
    const el=DOMFromString(content);

    const body=xpath(el,'text/body');
    ctx.charmap=meta_cbeta.buildCharMap(el);
    ctx.started=false ;//hide text until milestone
    walkDOMOfftext(body,ctx,onOpen, onClose);
    let t=ctx.out.trim();
    t=t.replace(/#CB(\d+);/g,(m,m1)=>{
        return ctx.charmap['CB'+m1]||'^mc'+m1;
    });

    lines.push(t);
    ctx.out=''
});
const tidy=lines=>{
    const out=[];
    const keys={};
    lines=lines.join('\n').split('\n')
    for (let i=0;i<lines.length;i++) {
        const l=lines[i];
        if (parseInt(l)) {
            out.push('^juan'+parseInt(l))
        }else if (!l.indexOf('^《')) {
            out.push(l)
        } else if (l.match(/^[^。]{1,20}〔/)) {
            out.push(l.replace(/^([^。〕]{1,20})〔([^〕]+?)〕/g,(m,m1,m2)=>{
                if (!keys[m1]) keys[m1]=0;
                keys[m1]++;
                return m1+"\t"+m2;
            }));
        }
    }
    const arr=sortObj(keys);
    console.log(arr.length,arr)
    return out;
}
const out=tidy(lines);
writeChanged('2128.txt',out.join('\n'),true);
