/**
 * 替换特殊符号=>换行符号
 */
export function replaceSpecialChar2NChar(pages) {
    pages.forEach((page) => {
        let cpts = page.components
        cpts.forEach((cpt) => {
            if (cpt.type === 'textarea' && cpt.attribute.value) {
                let new_value = cpt.attribute.value.replaceAll(/#####/g, "\n");
                console.log('new_value2:', new_value)
                cpt.attribute.value = new_value
            }
        })
    })
    return pages
}