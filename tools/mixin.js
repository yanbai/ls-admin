function mixin( /*Object*/ dest, /*Object*/ mixins) {
    for (var p in mixins) {
        if (mixins.hasOwnProperty(p)) {
            dest[p] = mixins[p];
        }
    }
}

module.exports = mixin;