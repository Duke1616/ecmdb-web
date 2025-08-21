// Demo code (the actual new parser character stream implementation)

function StringStream(string) {
  this.pos = 0
  this.string = string
}

StringStream.prototype = {
  done: function () {
    return this.pos >= this.string.length
  },
  peek: function () {
    return this.string.charAt(this.pos)
  },
  next: function () {
    if (this.pos < this.string.length) return this.string.charAt(this.pos++)
  },
  backUp: function (n) {
    this.pos -= n
  },
  column: function () {
    return this.pos
  }
}
