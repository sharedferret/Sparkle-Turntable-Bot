//ICA inside joke

exports.name = 'antiquing';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = ('\"Antiquing\" is the act of shopping, identifying, negotiating, or '
        + 'bargaining for antiques. Items can be bought for personal use, gifts, and '
        + 'in the case of brokers and dealers, profit.');
    output({text: response, destination: data.source, userid: data.userid});
}